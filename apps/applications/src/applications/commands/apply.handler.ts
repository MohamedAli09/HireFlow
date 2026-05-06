import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ApplyCommand } from './apply.command';
import { Application } from '../application.entity';
import { JobsClient } from '../../jobs/jobs.client';

@CommandHandler(ApplyCommand)
export class ApplyHandler implements ICommandHandler<ApplyCommand> {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    private readonly amqpConnection: AmqpConnection,
    private readonly jobsClient: JobsClient,
  ) {}

  async execute(command: ApplyCommand): Promise<Application> {
    const job = await this.jobsClient.getJob(command.jobId);
    if (!job.isActive) throw new BadRequestException('Job is no longer accepting applications');

    const application = this.applicationRepo.create({
      jobId: job.id,
      jobTitle: job.title,
      recruiterId: job.recruiterId,
      candidateId: command.candidateId,
      candidateEmail: command.candidateEmail,
    });

    const saved = await this.applicationRepo.save(application);

    await this.amqpConnection.publish('hireflow.exchange', 'application.created', { ...saved });

    return saved;
  }
}
