import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AmqpConnection, Nack } from '@golevelup/nestjs-rabbitmq';
import { JobsConsumer } from './jobs.consumer';
import { Job } from './job.entity';

const mockJobRepo = {
  findOne: jest.fn(),
  increment: jest.fn(),
};

const mockAmqpConnection = { publish: jest.fn() };

const baseEvent = {
  applicationId: 10,
  jobId: 1,
  jobTitle: 'Software Engineer',
  candidateEmail: 'candidate@test.com',
  recruiterId: 5,
  appliedAt: new Date(),
  correlationId: 'corr-abc',
};

describe('JobsConsumer', () => {
  let consumer: JobsConsumer;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsConsumer,
        { provide: getRepositoryToken(Job), useValue: mockJobRepo },
        { provide: AmqpConnection, useValue: mockAmqpConnection },
      ],
    }).compile();

    consumer = module.get<JobsConsumer>(JobsConsumer);
    jest.clearAllMocks();
  });

  describe('handleApplicationCreated()', () => {
    it('publishes compensation event and returns void when job is not found', async () => {
      mockJobRepo.findOne.mockResolvedValue(null);

      const result = await consumer.handleApplicationCreated(baseEvent);

      expect(mockAmqpConnection.publish).toHaveBeenCalledWith(
        'hireflow.exchange',
        'applicant.count.failed',
        expect.objectContaining({ applicationId: 10 }),
      );
      expect(mockJobRepo.increment).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('publishes compensation event and returns void when job is not active', async () => {
      mockJobRepo.findOne.mockResolvedValue({ id: 1, isActive: false });

      const result = await consumer.handleApplicationCreated(baseEvent);

      expect(mockAmqpConnection.publish).toHaveBeenCalledWith(
        'hireflow.exchange',
        'applicant.count.failed',
        expect.objectContaining({ applicationId: 10 }),
      );
      expect(mockJobRepo.increment).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('increments applicant count and publishes applicant.count.updated on success', async () => {
      mockJobRepo.findOne.mockResolvedValue({ id: 1, isActive: true });
      mockJobRepo.increment.mockResolvedValue({});
      mockAmqpConnection.publish.mockResolvedValue(undefined);

      await consumer.handleApplicationCreated(baseEvent);

      expect(mockJobRepo.increment).toHaveBeenCalledWith(
        { id: 1 },
        'applicantCount',
        1,
      );
      expect(mockAmqpConnection.publish).toHaveBeenCalledWith(
        'hireflow.exchange',
        'applicant.count.updated',
        expect.objectContaining({
          applicationId: 10,
          jobId: 1,
          correlationId: 'corr-abc',
        }),
      );
    });

    it('returns Nack(true) for transient DB errors (ECONNREFUSED)', async () => {
      const error = Object.assign(new Error('connection refused'), {
        code: 'ECONNREFUSED',
      });
      mockJobRepo.findOne.mockRejectedValue(error);

      const result = await consumer.handleApplicationCreated(baseEvent);

      expect(result).toBeInstanceOf(Nack);
      expect((result as Nack).requeue).toBe(true);
    });

    it('returns Nack(false) for non-transient errors', async () => {
      mockJobRepo.findOne.mockRejectedValue(new Error('syntax error in query'));

      const result = await consumer.handleApplicationCreated(baseEvent);

      expect(result).toBeInstanceOf(Nack);
      expect((result as Nack).requeue).toBe(false);
    });
  });
});
