import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Role, UserPayload } from '@app/common';

@Injectable()
export class GatewayUserGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();

        const sub   = request.headers['x-user-id'];
        const email = request.headers['x-user-email'];
        const role  = request.headers['x-user-role'] as Role;

        if (!sub || !email || !role) {
            throw new UnauthorizedException('Missing gateway user headers');
        }

        request.user = { sub, email, role } satisfies UserPayload;
        return true;
    }
}
