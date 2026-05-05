import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProxyService } from '../proxy/proxy.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../guards/roles.guard';
import { Role } from '@app/common';

@Controller('applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicationsController {
    constructor(
        private readonly proxy: ProxyService,
        private readonly config: ConfigService,
    ) { }

    // Only candidates can apply — enforced once here, removed from Applications Service
    @Post()
    @Roles(Role.CANDIDATE)
    apply(@Body() body: any, @Request() req: any) {
        return this.proxy.forward(
            'POST',
            `${this.config.get('APPLICATIONS_SERVICE_URL')}/applications`,
            body,
            req.user,
        );
    }

    @Get('my')
    @Roles(Role.CANDIDATE)
    myApplications(@Request() req: any) {
        return this.proxy.forward(
            'GET',
            `${this.config.get('APPLICATIONS_SERVICE_URL')}/applications/my`,
            null,
            req.user,
        );
    }
}