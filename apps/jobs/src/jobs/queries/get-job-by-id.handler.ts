import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { GetJobByIdQuery } from './get-job-by-id.query';
import { Job } from '../job.entity';

@QueryHandler(GetJobByIdQuery)
export class GetJobByIdHandler implements IQueryHandler<GetJobByIdQuery> {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
  ) {}

  async execute(query: GetJobByIdQuery): Promise<Job> {
    const job = await this.jobRepo.findOne({ where: { id: query.id } });
    if (!job) throw new NotFoundException(`Job #${query.id} not found`);
    return job;
  }
}
