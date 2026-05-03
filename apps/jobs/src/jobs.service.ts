// apps/jobs/src/jobs/jobs.service.ts
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './jobs/job.entity';
import { Role, UserPayload } from '@app/common';

export class CreateJobDto {
  title!: string;
  description!: string;
  location!: string;
  salaryMin?: number;
  salaryMax?: number;
}

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
  ) { }

  async create(dto: CreateJobDto, recruiter: UserPayload): Promise<Job> {
    // Only recruiters can post jobs — enforced in the service layer
    if (recruiter.role !== Role.RECRUITER && recruiter.role !== Role.ADMIN) {
      throw new ForbiddenException('Only recruiters can post jobs');
    }

    const job = this.jobRepo.create({ ...dto, recruiterId: +recruiter.sub });
    return this.jobRepo.save(job);
  }

  findAll(): Promise<Job[]> {
    // Public endpoint — no auth needed to browse jobs
    return this.jobRepo.find({ where: { isActive: true }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<Job> {
    const job = await this.jobRepo.findOne({ where: { id } });
    if (!job) throw new NotFoundException(`Job #${id} not found`);
    return job;
  }
}