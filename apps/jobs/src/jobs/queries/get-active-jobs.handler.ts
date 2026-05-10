// apps/jobs/src/jobs/queries/get-active-jobs.handler.ts
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetActiveJobsQuery } from './get-active-jobs.query';
import { Job } from '../job.entity';

// This is the read model — a flat, lightweight shape optimized for the list view.
// Notice it only has the fields the UI actually needs — nothing more.
// This is called a "read model" or "projection" in CQRS terminology.
export class JobListItem {
  id!: number;
  title!: string;
  location!: string;
  salaryMin!: number;
  salaryMax!: number;
  createdAt!: Date;
}

@QueryHandler(GetActiveJobsQuery)
export class GetActiveJobsHandler implements IQueryHandler<GetActiveJobsQuery> {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
  ) {}

  async execute(query: GetActiveJobsQuery): Promise<JobListItem[]> {
    const qb = this.jobRepo
      .createQueryBuilder('job')
      .where('job.isActive = :isActive', { isActive: true })
      // Select only the fields needed for the list — not the full entity.
      // This is lighter, faster, and exactly what the UI needs.
      .select([
        'job.id',
        'job.title',
        'job.location',
        'job.salaryMin',
        'job.salaryMax',
        'job.createdAt',
      ]);

    if (query.location) {
      qb.andWhere('job.location ILIKE :location', {
        location: `%${query.location}%`,
      });
    }

    if (query.salaryMin) {
      qb.andWhere('job.salaryMin >= :salaryMin', {
        salaryMin: query.salaryMin,
      });
    }

    return qb.getMany();
  }
}
