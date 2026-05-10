import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { GetJobByIdHandler } from './get-job-by-id.handler';
import { GetJobByIdQuery } from './get-job-by-id.query';
import { Job } from '../job.entity';

const mockJobRepo = { findOne: jest.fn() };

describe('GetJobByIdHandler', () => {
  let handler: GetJobByIdHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetJobByIdHandler,
        { provide: getRepositoryToken(Job), useValue: mockJobRepo },
      ],
    }).compile();

    handler = module.get<GetJobByIdHandler>(GetJobByIdHandler);
    jest.clearAllMocks();
  });

  it('returns the job when found', async () => {
    const job = { id: 1, title: 'Software Engineer', isActive: true };
    mockJobRepo.findOne.mockResolvedValue(job);

    const result = await handler.execute(new GetJobByIdQuery(1));

    expect(mockJobRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toEqual(job);
  });

  it('throws NotFoundException when job does not exist', async () => {
    mockJobRepo.findOne.mockResolvedValue(null);

    await expect(handler.execute(new GetJobByIdQuery(99))).rejects.toThrow(NotFoundException);
  });
});
