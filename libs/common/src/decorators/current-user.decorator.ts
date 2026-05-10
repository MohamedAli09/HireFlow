import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UserPayload } from '../interfaces/user-payload.interface';
import { Role } from '../enums/role.enum';

// Instead of @Request() req → req.user, services now use @CurrentUser()
// which reads from the trusted headers the gateway forwarded
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserPayload => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return {
      sub: request.headers['x-user-id'] as string,
      email: request.headers['x-user-email'] as string,
      role: request.headers['x-user-role'] as Role,
    };
  },
);
