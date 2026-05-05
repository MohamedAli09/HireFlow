import { Controller, Post, Body } from '@nestjs/common';
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
    register(@Body() body: any) {
        return this.proxy.forward('POST', `${this.config.get('AUTH_SERVICE_URL')}/auth/register`, body);
    }

    @Post('login')
    @Public()
    login(@Body() body: any) {
        return this.proxy.forward('POST', `${this.config.get('AUTH_SERVICE_URL')}/auth/login`, body);
    }
}