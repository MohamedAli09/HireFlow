import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request as ExpressRequest } from 'express';
import { ProxyService } from '../proxy/proxy.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../guards/roles.guard';
import { Role, UserPayload } from '@app/common';

type AppRequest = ExpressRequest & { user?: UserPayload };

@Controller('interviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.RECRUITER, Role.ADMIN)
export class InterviewsController {
  constructor(
    private readonly proxy: ProxyService,
    private readonly config: ConfigService,
  ) {}

  @Post()
  @Roles(Role.RECRUITER, Role.ADMIN)
  schedule(@Body() body: any, @Request() req: AppRequest) {
    return this.proxy.forward(
      'POST',
      `${this.config.get('INTERVIEWS_SERVICE_URL')}/interviews`,
      body,
      req.user,
      req.correlationId,
    );
  }

  @Get('my')
  myInterviews(@Request() req: AppRequest) {
    return this.proxy.forward(
      'GET',
      `${this.config.get('INTERVIEWS_SERVICE_URL')}/interviews/my`,
      null,
      req.user,
      req.correlationId,
    );
  }
}
