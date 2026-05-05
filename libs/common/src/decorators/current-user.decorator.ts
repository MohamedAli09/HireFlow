import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserPayload } from '../interfaces/user-payload.interface';

// Instead of @Request() req → req.user, services now use @CurrentUser()
// which reads from the trusted headers the gateway forwarded
export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): UserPayload => {
        const request = ctx.switchToHttp().getRequest();
        return {
            sub: request.headers['x-user-id'],
            email: request.headers['x-user-email'],
            role: request.headers['x-user-role'],
        };
    },
);