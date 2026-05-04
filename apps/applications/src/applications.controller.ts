// apps/applications/src/applications/applications.controller.ts
import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ApplicationsService, ApplyDto } from './applications.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { UserPayload } from '@app/common';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  apply(@Body() dto: ApplyDto, @Request() req: { user: UserPayload }) {
    return this.applicationsService.apply(dto, req.user);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  myApplications(@Request() req: { user: UserPayload }) {
    return this.applicationsService.findByCandidate(+req.user.sub);
  }
}