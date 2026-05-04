import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JobsService, CreateJobDto } from './jobs.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { UserPayload } from '@app/common';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) { }

  // Public — anyone can browse jobs without being logged in
  @Get()
  findAll() {
    return this.jobsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(+id);
  }

  // Protected — must be an authenticated recruiter
  @Post()
  @UseGuards(JwtAuthGuard)   // ← this triggers the HTTP call to Auth Service
  create(@Body() dto: CreateJobDto, @Request() req: { user: UserPayload }) {
    return this.jobsService.create(dto, req.user);
  }
}