import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Nack } from '@golevelup/nestjs-rabbitmq';
import { ApplicationsConsumer } from './applications.consumer';
import { Application, ApplicationStatus } from './application.entity';

const mockApplicationRepo = { update: jest.fn() };

const baseEvent = {
  applicationId: 10,
  reason: 'Job #1 not found',
  correlationId: 'corr-abc',
};

describe('ApplicationsConsumer', () => {
  let consumer: ApplicationsConsumer;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsConsumer,
        {
          provide: getRepositoryToken(Application),
          useValue: mockApplicationRepo,
        },
      ],
    }).compile();

    consumer = module.get<ApplicationsConsumer>(ApplicationsConsumer);
    jest.clearAllMocks();
  });

  describe('handleApplicantCountFailed()', () => {
    it('cancels the application by updating its status to CANCELLED', async () => {
      mockApplicationRepo.update.mockResolvedValue({});

      await consumer.handleApplicantCountFailed(baseEvent);

      expect(mockApplicationRepo.update).toHaveBeenCalledWith(
        { id: 10 },
        { status: ApplicationStatus.CANCELLED },
      );
    });

    it('returns Nack(true) for transient DB errors (ECONNREFUSED)', async () => {
      const error = Object.assign(new Error('connection refused'), {
        code: 'ECONNREFUSED',
      });
      mockApplicationRepo.update.mockRejectedValue(error);

      const result = await consumer.handleApplicantCountFailed(baseEvent);

      expect(result).toBeInstanceOf(Nack);
      expect((result as Nack).requeue).toBe(true);
    });

    it('returns Nack(false) for non-transient errors', async () => {
      mockApplicationRepo.update.mockRejectedValue(
        new Error('constraint violation'),
      );

      const result = await consumer.handleApplicantCountFailed(baseEvent);

      expect(result).toBeInstanceOf(Nack);
      expect((result as Nack).requeue).toBe(false);
    });
  });
});
