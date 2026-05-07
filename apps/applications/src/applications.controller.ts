import { Controller, Post, Get, Body, Headers } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApplyCommand } from './applications/commands/apply.command';
import { GetMyApplicationsQuery } from './applications/queries/get-my-applications.query';
import { CurrentUser, UserPayload } from '@app/common';

@Controller('applications')
export class ApplicationsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  apply(
    @Body() body: { jobId: number },
    @CurrentUser() user: UserPayload,
    @Headers('x-correlation-id') correlationId: string,
  ) {
    return this.commandBus.execute(
      new ApplyCommand(body.jobId, +user.sub, user.email, correlationId),
    );
  }

  @Get('my')
  myApplications(@CurrentUser() user: UserPayload) {
    return this.queryBus.execute(new GetMyApplicationsQuery(+user.sub));
  }
}
