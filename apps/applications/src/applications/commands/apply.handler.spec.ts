import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ApplyHandler } from './apply.handler';
import { ApplyCommand } from './apply.command';
import { Application } from '../application.entity';
import { JobsClient } from '../../jobs/jobs.client';

const mockApplicationRepo = {
  create: jest.fn(),
  save: jest.fn(),
};

const mockAmqpConnection = { publish: jest.fn() };
const mockJobsClient = { getJob: jest.fn() };

const command = new ApplyCommand(1, 42, 'candidate@test.com', 'corr-xyz');

describe('ApplyHandler', () => {
  let handler: ApplyHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplyHandler,
        { provide: getRepositoryToken(Application), useValue: mockApplicationRepo },
        { provide: AmqpConnection, useValue: mockAmqpConnection },
        { provide: JobsClient, useValue: mockJobsClient },
      ],
    }).compile();

    handler = module.get<ApplyHandler>(ApplyHandler);
    jest.clearAllMocks();
  });

  it('throws BadRequestException when job is no longer accepting applications', async () => {
    mockJobsClient.getJob.mockResolvedValue({ id: 1, title: 'Dev', recruiterId: 5, isActive: false });

    await expect(handler.execute(command)).rejects.toThrow(BadRequestException);
    expect(mockApplicationRepo.save).not.toHaveBeenCalled();
  });

  it('bubbles up NotFoundException when job does not exist', async () => {
    mockJobsClient.getJob.mockRejectedValue(new NotFoundException('Job not found'));

    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
  });

  it('creates application with denormalized job data and returns the saved entity', async () => {
    const job = { id: 1, title: 'Software Engineer', recruiterId: 5, isActive: true };
    const created = { jobId: 1, jobTitle: 'Software Engineer', recruiterId: 5, candidateId: 42, candidateEmail: 'candidate@test.com' };
    const saved = { ...created, id: 100, status: 'applied', appliedAt: new Date() };

    mockJobsClient.getJob.mockResolvedValue(job);
    mockApplicationRepo.create.mockReturnValue(created);
    mockApplicationRepo.save.mockResolvedValue(saved);
    mockAmqpConnection.publish.mockResolvedValue(undefined);

    const result = await handler.execute(command);

    expect(mockApplicationRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      jobId: 1,
      jobTitle: 'Software Engineer',
      recruiterId: 5,
      candidateId: 42,
      candidateEmail: 'candidate@test.com',
    }));
    expect(result).toEqual(saved);
  });

  it('publishes application.created event with correlationId after saving', async () => {
    const job = { id: 1, title: 'Software Engineer', recruiterId: 5, isActive: true };
    const saved = { id: 100, jobId: 1, jobTitle: 'Software Engineer', recruiterId: 5, candidateId: 42, candidateEmail: 'candidate@test.com' };

    mockJobsClient.getJob.mockResolvedValue(job);
    mockApplicationRepo.create.mockReturnValue(saved);
    mockApplicationRepo.save.mockResolvedValue(saved);
    mockAmqpConnection.publish.mockResolvedValue(undefined);

    await handler.execute(command);

    expect(mockAmqpConnection.publish).toHaveBeenCalledWith(
      'hireflow.exchange',
      'application.created',
      expect.objectContaining({ id: 100, correlationId: 'corr-xyz' }),
    );
  });
});
