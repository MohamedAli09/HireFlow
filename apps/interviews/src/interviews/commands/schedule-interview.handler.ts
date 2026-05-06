import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ScheduleInterviewCommand } from './schedule-interview.command';
import { Interview } from '../interview.entity';

@CommandHandler(ScheduleInterviewCommand)
export class ScheduleInterviewHandler implements ICommandHandler<ScheduleInterviewCommand> {
  constructor(
    @InjectRepository(Interview)
    private readonly interviewRepo: Repository<Interview>,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  async execute(command: ScheduleInterviewCommand): Promise<Interview> {
    const interview = this.interviewRepo.create({
      applicationId: command.applicationId,
      candidateId: command.candidateId,
      candidateEmail: command.candidateEmail,
      jobTitle: command.jobTitle,
      scheduledAt: command.scheduledAt,
      recruiterId: command.recruiterId,
      meetingLink: command.meetingLink,
    });

    const saved = await this.interviewRepo.save(interview);

    await this.amqpConnection.publish('hireflow', 'interview.scheduled', {
      interviewId: saved.id,
      candidateEmail: saved.candidateEmail,
      jobTitle: saved.jobTitle,
      scheduledAt: saved.scheduledAt,
      meetingLink: saved.meetingLink,
    });

    return saved;
  }
}
