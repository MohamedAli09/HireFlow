// apps/applications/src/applications/applications.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Application } from './applications/application.entity';
import { UserPayload } from '@app/common';
import { JobsClient } from './jobs/jobs.client';
export class ApplyDto {
  jobId!: number;
  recruiterId!: number;
  jobTitle!: string;        // passed in by the client from the job listing they viewed
}

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    private readonly amqpConnection: AmqpConnection,
    private readonly jobsClient: JobsClient,
  ) { }

  async apply(dto: ApplyDto, candidate: UserPayload): Promise<Application> {
    // Step 1 — verify from trusted source, never from client
    const job = await this.jobsClient.getJob(dto.jobId);
    if (!job.isActive) throw new BadRequestException('Job is no longer accepting applications');

    // Step 2 — everything comes from verified sources now
    const application = this.applicationRepo.create({
      jobId: job.id,
      jobTitle: job.title,             
      recruiterId: job.recruiterId,   
      candidateId: +candidate.sub,      
      candidateEmail: candidate.email, 
    });

    const saved = await this.applicationRepo.save(application);

    // Step 3 — publish verified data
    await this.amqpConnection.publish('hireflow.exchange', 'application.created', {
      ...saved,
    });

    return saved;
  }

  findByCandidate(candidateId: number): Promise<Application[]> {
    return this.applicationRepo.find({ where: { candidateId } });
  }
}