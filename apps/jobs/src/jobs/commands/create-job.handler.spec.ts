import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateJobHandler } from './create-job.handler';
import { CreateJobCommand } from './create-job.command';
import { Job } from '../job.entity';

const mockJobRepo = {
  create: jest.fn(),
  save: jest.fn(),
};

const command = new CreateJobCommand(
  'Software Engineer',
  'Build great things',
  'Cairo',
  5,
  3000,
  6000,
  'corr-xyz',
);

describe('CreateJobHandler', () => {
  let handler: CreateJobHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateJobHandler,
        { provide: getRepositoryToken(Job), useValue: mockJobRepo },
      ],
    }).compile();

    handler = module.get<CreateJobHandler>(CreateJobHandler);
    jest.clearAllMocks();
  });

  it('creates a job entity with all fields from the command', async () => {
    const created = { title: 'Software Engineer', recruiterId: 5 };
    const saved = { ...created, id: 1 };
    mockJobRepo.create.mockReturnValue(created);
    mockJobRepo.save.mockResolvedValue(saved);

    await handler.execute(command);

    expect(mockJobRepo.create).toHaveBeenCalledWith({
      title: 'Software Engineer',
      description: 'Build great things',
      location: 'Cairo',
      recruiterId: 5,
      salaryMin: 3000,
      salaryMax: 6000,
    });
  });

  it('saves the entity and returns the saved result', async () => {
    const created = { title: 'Software Engineer' };
    const saved = { id: 1, title: 'Software Engineer' };
    mockJobRepo.create.mockReturnValue(created);
    mockJobRepo.save.mockResolvedValue(saved);

    const result = await handler.execute(command);

    expect(mockJobRepo.save).toHaveBeenCalledWith(created);
    expect(result).toEqual(saved);
  });
});
