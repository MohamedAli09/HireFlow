import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { JobsClient } from './jobs.client';

const mockHttpService = { get: jest.fn() };
const mockConfigService = { get: jest.fn().mockReturnValue('http://jobs-svc') };

describe('JobsClient', () => {
  let client: JobsClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsClient,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    client = module.get<JobsClient>(JobsClient);
    jest.clearAllMocks();
    mockConfigService.get.mockReturnValue('http://jobs-svc');
  });

  it('returns the job when the downstream service responds successfully', async () => {
    const job = { id: 1, title: 'Dev', recruiterId: 5, isActive: true };
    mockHttpService.get.mockReturnValue(of({ data: job }));

    const result = await client.getJob(1);

    expect(mockHttpService.get).toHaveBeenCalledWith('http://jobs-svc/jobs/1');
    expect(result).toEqual(job);
  });

  it('throws NotFoundException when downstream returns 404', async () => {
    mockHttpService.get.mockReturnValue(throwError(() => ({ response: { status: 404 } })));

    await expect(client.getJob(99)).rejects.toThrow(NotFoundException);
  });

  it('re-throws the original error for non-404 responses', async () => {
    const serverError = { response: { status: 500, data: 'Internal Server Error' } };
    mockHttpService.get.mockReturnValue(throwError(() => serverError));

    await expect(client.getJob(1)).rejects.toEqual(serverError);
  });
});
