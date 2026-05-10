import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GetMyApplicationsHandler } from './get-my-applications.handler';
import { GetMyApplicationsQuery } from './get-my-applications.query';
import { Application } from '../application.entity';

const mockApplicationRepo = { find: jest.fn() };

describe('GetMyApplicationsHandler', () => {
  let handler: GetMyApplicationsHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetMyApplicationsHandler,
        { provide: getRepositoryToken(Application), useValue: mockApplicationRepo },
      ],
    }).compile();

    handler = module.get<GetMyApplicationsHandler>(GetMyApplicationsHandler);
    jest.clearAllMocks();
  });

  it('returns all applications for the given candidateId', async () => {
    const applications = [
      { id: 1, candidateId: 42, jobId: 10 },
      { id: 2, candidateId: 42, jobId: 11 },
    ];
    mockApplicationRepo.find.mockResolvedValue(applications);

    const result = await handler.execute(new GetMyApplicationsQuery(42));

    expect(mockApplicationRepo.find).toHaveBeenCalledWith({ where: { candidateId: 42 } });
    expect(result).toEqual(applications);
  });

  it('returns an empty array when the candidate has no applications', async () => {
    mockApplicationRepo.find.mockResolvedValue([]);

    const result = await handler.execute(new GetMyApplicationsQuery(99));

    expect(result).toEqual([]);
  });
});
