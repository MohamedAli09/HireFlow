// apps/applications/src/applications/applications.controller.ts
import { Controller, Post, Get, Body } from '@nestjs/common';
import { ApplicationsService, ApplyDto } from './applications.service';
import { CurrentUser, UserPayload } from '@app/common';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) { }

  // No @UseGuards(JwtAuthGuard) — gateway already verified the token
  // No @Request() req — @CurrentUser() reads from trusted headers
  @Post()
  apply(@Body() dto: ApplyDto, @CurrentUser() user: UserPayload) {
    return this.applicationsService.apply(dto, user);
  }

  @Get('my')
  myApplications(@CurrentUser() user: UserPayload) {
    return this.applicationsService.findByCandidate(+user.sub);
  }
}