import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
    Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { UserPayload } from '@app/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    private readonly logger = new Logger(JwtAuthGuard.name);

    constructor(
        private readonly httpService: HttpService,  
        private readonly config: ConfigService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader: string = request.headers['authorization'];

        if (!authHeader?.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing authorization header');
        }

        try {
            // HERE is the distributed systems reality: to verify this token,
            // Jobs Service must make a network call to Auth Service.
            // This means: if Auth Service is down, this guard always throws.
            // If Auth Service is slow, this guard is slow. Every protected Jobs endpoint
            // now has a hidden dependency on Auth Service's health.
            const authServiceUrl = this.config.get('AUTH_SERVICE_URL');

            const { data } = await firstValueFrom(
                this.httpService.get<UserPayload>(`${authServiceUrl}/auth/verify`, {
                    headers: { authorization: authHeader },
                }),
            );

            // Attach the decoded user to the request so controllers can access it
            request.user = data;
            return true;
        } catch (error) {
            this.logger.warn(`Token verification failed: ${error.message}`);
            throw new UnauthorizedException('Invalid or expired token');
        }
    }
}