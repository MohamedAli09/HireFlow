import { Controller, Post, Get, Body, Headers } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ScheduleInterviewCommand } from './interviews/commands/schedule-interview.command';
import { GetMyInterviewsQuery } from './interviews/queries/get-my-interviews.query';
import { CurrentUser, UserPayload } from '@app/common';

@Controller('interviews')
export class InterviewsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  schedule(
    @Body()
    body: {
      applicationId: number;
      candidateId: number;
      candidateEmail: string;
      jobTitle: string;
      scheduledAt: Date;
      meetingLink?: string;
    },
    @CurrentUser() user: UserPayload,
    @Headers('x-correlation-id') correlationId: string,
  ) {
    return this.commandBus.execute(
      new ScheduleInterviewCommand(
        body.applicationId,
        body.candidateId,
        body.candidateEmail,
        body.jobTitle,
        body.scheduledAt,
        +user.sub,
        body.meetingLink,
        correlationId,
      ),
    );
  }

  @Get('my')
  myInterviews(@CurrentUser() user: UserPayload) {
    return this.queryBus.execute(new GetMyInterviewsQuery(+user.sub));
  }
}
