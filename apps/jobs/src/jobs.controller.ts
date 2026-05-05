import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { JobsService, CreateJobDto } from './jobs.service';
import { CurrentUser } from '@app/common';
import { UserPayload } from '@app/common';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) { }

  @Get()
  findAll() {
    return this.jobsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(+id);
  }

  @Post()
  create(@Body() dto: CreateJobDto, @CurrentUser() user: UserPayload) {
    return this.jobsService.create(dto, user);
  }
}
