import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GetActiveJobsHandler } from './get-active-jobs.handler';
import { GetActiveJobsQuery } from './get-active-jobs.query';
import { Job } from '../job.entity';

const mockQb = {
  where: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getMany: jest.fn(),
};

const mockJobRepo = {
  createQueryBuilder: jest.fn().mockReturnValue(mockQb),
};

describe('GetActiveJobsHandler', () => {
  let handler: GetActiveJobsHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetActiveJobsHandler,
        { provide: getRepositoryToken(Job), useValue: mockJobRepo },
      ],
    }).compile();

    handler = module.get<GetActiveJobsHandler>(GetActiveJobsHandler);
    jest.clearAllMocks();
    mockJobRepo.createQueryBuilder.mockReturnValue(mockQb);
    mockQb.where.mockReturnThis();
    mockQb.select.mockReturnThis();
    mockQb.andWhere.mockReturnThis();
  });

  it('returns all active jobs when no filters are provided', async () => {
    const jobs = [{ id: 1, title: 'Dev', location: 'Cairo' }];
    mockQb.getMany.mockResolvedValue(jobs);

    const result = await handler.execute(new GetActiveJobsQuery());

    expect(mockQb.where).toHaveBeenCalledWith('job.isActive = :isActive', { isActive: true });
    expect(mockQb.andWhere).not.toHaveBeenCalled();
    expect(result).toEqual(jobs);
  });

  it('applies location filter with ILIKE when location is provided', async () => {
    mockQb.getMany.mockResolvedValue([]);

    await handler.execute(new GetActiveJobsQuery('Cairo'));

    expect(mockQb.andWhere).toHaveBeenCalledWith(
      'job.location ILIKE :location',
      { location: '%Cairo%' },
    );
  });

  it('applies salary filter when salaryMin is provided', async () => {
    mockQb.getMany.mockResolvedValue([]);

    await handler.execute(new GetActiveJobsQuery(undefined, 5000));

    expect(mockQb.andWhere).toHaveBeenCalledWith(
      'job.salaryMin >= :salaryMin',
      { salaryMin: 5000 },
    );
  });

  it('applies both filters when location and salaryMin are provided', async () => {
    mockQb.getMany.mockResolvedValue([]);

    await handler.execute(new GetActiveJobsQuery('Cairo', 5000));

    expect(mockQb.andWhere).toHaveBeenCalledTimes(2);
    expect(mockQb.andWhere).toHaveBeenCalledWith('job.location ILIKE :location', { location: '%Cairo%' });
    expect(mockQb.andWhere).toHaveBeenCalledWith('job.salaryMin >= :salaryMin', { salaryMin: 5000 });
  });
});
