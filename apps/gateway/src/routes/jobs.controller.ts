import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request as ExpressRequest } from 'express';
import { ProxyService } from '../proxy/proxy.service';
import { JwtAuthGuard, Public } from '../guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../guards/roles.guard';
import { Role, UserPayload } from '@app/common';

type AppRequest = ExpressRequest & { user?: UserPayload };

@Controller('jobs')
@UseGuards(JwtAuthGuard, RolesGuard) // applied to all routes in this controller
export class JobsController {
  constructor(
    private readonly proxy: ProxyService,
    private readonly config: ConfigService,
  ) {}

  // Public — anyone can browse jobs without a token
  @Get()
  @Public()
  findAll(@Request() req: AppRequest) {
    return this.proxy.forward(
      'GET',
      `${this.config.get('JOBS_SERVICE_URL')}/jobs`,
      null,
      undefined,
      req.correlationId,
    );
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string, @Request() req: AppRequest) {
    return this.proxy.forward(
      'GET',
      `${this.config.get('JOBS_SERVICE_URL')}/jobs/${id}`,
      null,
      undefined,
      req.correlationId,
    );
  }

  // Only recruiters can post jobs — enforced once here, not in Jobs Service
  @Post()
  @Roles(Role.RECRUITER, Role.ADMIN)
  create(@Body() body: any, @Request() req: AppRequest) {
    return this.proxy.forward(
      'POST',
      `${this.config.get('JOBS_SERVICE_URL')}/jobs`,
      body,
      req.user,
      req.correlationId,
    );
  }
}
