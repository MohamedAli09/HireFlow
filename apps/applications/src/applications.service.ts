// apps/applications/src/applications/applications.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Application } from './applications/application.entity';
import { UserPayload } from '@app/common';

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
  ) { }

  async apply(dto: ApplyDto, candidate: UserPayload): Promise<Application> {
    // Step 1 — save the application
    const application = this.applicationRepo.create({
      jobId: dto.jobId,
      candidateId: +candidate.sub,
      recruiterId: dto.recruiterId,
      jobTitle: dto.jobTitle,
      candidateEmail: candidate.email,
    });
    const saved = await this.applicationRepo.save(application);

    // Step 2 — publish the event and move on immediately.
    // We do NOT wait for anyone to process this. We don't care if Notifications
    // Service is running. We just put the event in the broker and return.
    await this.amqpConnection.publish(
      'hireflow.exchange',      // the exchange name
      'application.created',    // the routing key — like the "subject" of the message
      {
        applicationId: saved.id,
        jobId: saved.jobId,
        jobTitle: saved.jobTitle,
        candidateEmail: saved.candidateEmail,
        recruiterId: saved.recruiterId,
        appliedAt: saved.appliedAt,
      },
    );

    return saved;
  }

  findByCandidate(candidateId: number): Promise<Application[]> {
    return this.applicationRepo.find({ where: { candidateId } });
  }
}