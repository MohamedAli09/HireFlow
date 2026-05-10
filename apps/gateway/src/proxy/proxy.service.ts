import {
  Injectable,
  Logger,
  BadGatewayException,
  HttpException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig } from 'axios';
import { UserPayload } from '@app/common';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  constructor(private readonly httpService: HttpService) {}

  async forward(
    method: string,
    targetUrl: string,
    body: any,
    user?: UserPayload, // decoded user from JWT — may be undefined for public routes
    correlationId?: string,
  ): Promise<any> {
    // Build the headers we forward to the downstream service.
    // This is how services know who is making the request —
    // they read these headers instead of verifying the JWT themselves.
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (user) {
      // Services trust these headers because they can only come from our gateway.
      // In production, firewall rules ensure no external caller can set these headers directly.
      headers['x-user-id'] = String(user.sub);
      headers['x-user-email'] = user.email;
      headers['x-user-role'] = user.role;
    }
    if (correlationId) {
      headers['x-correlation-id'] = correlationId;
    }
    const config: AxiosRequestConfig = { headers };

    try {
      this.logger.log(`Forwarding ${method} → ${targetUrl}`);

      const response = await firstValueFrom(
        method === 'GET'
          ? this.httpService.get(targetUrl, config)
          : method === 'POST'
            ? this.httpService.post(targetUrl, body, config)
            : method === 'PATCH'
              ? this.httpService.patch(targetUrl, body, config)
              : this.httpService.delete(targetUrl, config),
      );

      return response.data;
    } catch (err: unknown) {
      const error = err as {
        response?: { data: unknown; status: number };
        message?: string;
      };
      if (error.response) {
        throw new HttpException(
          error.response.data as object,
          error.response.status,
        );
      }
      this.logger.error(
        `Service unreachable: ${targetUrl} — ${error.message ?? 'unknown error'}`,
      );
      throw new BadGatewayException(`Downstream service unavailable`);
    }
  }
}
