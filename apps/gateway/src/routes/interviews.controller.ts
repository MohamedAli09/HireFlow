import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProxyService } from '../proxy/proxy.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../guards/roles.guard';
import { Role } from '@app/common';

@Controller('interviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.RECRUITER, Role.ADMIN)
export class InterviewsController {
    constructor(
        private readonly proxy: ProxyService,
        private readonly config: ConfigService,
    ) { }

    @Post()
    @Roles(Role.RECRUITER, Role.ADMIN)
    
    schedule(@Body() body: any, @Request() req: any) {
        return this.proxy.forward(
            'POST',
            `${this.config.get('INTERVIEWS_SERVICE_URL')}/interviews`,
            body,
            req.user,
            req['correlationId'],
        );
    }

    @Get('my')
    myInterviews(@Request() req: any) {
        return this.proxy.forward(
            'GET',
            `${this.config.get('INTERVIEWS_SERVICE_URL')}/interviews/my`,
            null,
            req.user,
            req['correlationId'],
        );
    }
}
