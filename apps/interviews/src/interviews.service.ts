import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Interview } from './interviews/interview.entity';  
import { UserPayload } from '@app/common';

export class ScheduleInterviewDto {
  applicationId!: number;
  candidateId!: number;
  candidateEmail!: string;
  jobTitle!: string;
  scheduledAt!: Date;
  meetingLink?: string;
}

@Injectable()
export class InterviewsService {
  constructor(
    @InjectRepository(Interview)
    private readonly interviewRepo: Repository<Interview>,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  async schedule(dto: ScheduleInterviewDto, recruiter: UserPayload): Promise<Interview> {
    const interview = this.interviewRepo.create({
      ...dto,
      recruiterId: +recruiter.sub,
    });

    const saved = await this.interviewRepo.save(interview);

    // Publish event — Notifications Service will consume this
    // and email the candidate that their interview is scheduled
    await this.amqpConnection.publish('hireflow', 'interview.scheduled', {
      interviewId: saved.id,
      candidateEmail: saved.candidateEmail,
      jobTitle: saved.jobTitle,
      scheduledAt: saved.scheduledAt,
      meetingLink: saved.meetingLink,
    });

    return saved;
  }

  findByRecruiter(recruiterId: number): Promise<Interview[]> {
    return this.interviewRepo.find({
      where: { recruiterId },
      order: { scheduledAt: 'ASC' },
    });
  }
}