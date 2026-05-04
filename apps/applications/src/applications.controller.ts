// apps/applications/src/applications/applications.controller.ts
import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ApplicationsService, ApplyDto } from './applications.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';
import { Role, UserPayload } from '@app/common';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  apply(@Body() dto: ApplyDto, @Request() req: { user: UserPayload }) {
    return this.applicationsService.apply(dto, req.user);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  myApplications(@Request() req: { user: UserPayload }) {
    return this.applicationsService.findByCandidate(+req.user.sub);
  }
}