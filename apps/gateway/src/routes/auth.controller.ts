import { Controller, Post, Body, Request } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProxyService } from '../proxy/proxy.service';
import { Public } from '../guards/jwt-auth.guard';

// All auth routes are public — you can't require a token to log in
@Controller('auth')
export class AuthController {
    constructor(
        private readonly proxy: ProxyService,
        private readonly config: ConfigService,
    ) { }

    @Post('register')
    @Public()
    register(@Body() body: any, @Request() req: any) {
        return this.proxy.forward('POST', `${this.config.get('AUTH_SERVICE_URL')}/auth/register`, body, undefined, req['correlationId']);
    }

    @Post('login')
    @Public()
    login(@Body() body: any, @Request() req: any) {
        return this.proxy.forward('POST', `${this.config.get('AUTH_SERVICE_URL')}/auth/login`, body, undefined, req['correlationId']);
    }
}