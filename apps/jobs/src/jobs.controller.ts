import { Controller, Get, Post, Body, Query, Param, ParseIntPipe } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateJobCommand } from './jobs/commands/create-job.command';
import { GetActiveJobsQuery } from './jobs/queries/get-active-jobs.query';
import { GetJobByIdQuery } from './jobs/queries/get-job-by-id.query';
import { CurrentUser, UserPayload } from '@app/common';

@Controller('jobs')
export class JobsController {
  constructor(
    // Instead of injecting JobsService, we inject the buses.
    // The controller no longer knows which handler processes the request.
    // It just says "here is a command/query, figure it out."
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) { }

  @Get()
  findAll(@Query('location') location?: string, @Query('salaryMin') salaryMin?: number) {
    // Dispatch a query — pure read, no side effects
    return this.queryBus.execute(new GetActiveJobsQuery(location, salaryMin));
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.queryBus.execute(new GetJobByIdQuery(id));
  }

  @Post()
  create(@Body() body: any, @CurrentUser() user: UserPayload) {
    return this.commandBus.execute(
      new CreateJobCommand(
        body.title,
        body.description,
        body.location,
        +user.sub,
        body.salaryMin,
        body.salaryMax,
      ),
    );
  }
}