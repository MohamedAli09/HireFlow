import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, UserPayload } from '@app/common';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!required?.length) return true;

        const user: UserPayload = context.switchToHttp().getRequest().user;

        if (!required.includes(user.role)) { 
            throw new ForbiddenException('Access restricted to candidates only');
        }

        return true;
    }
}
