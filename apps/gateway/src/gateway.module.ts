import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ProxyService } from './proxy/proxy.service';
import { AuthController } from './routes/auth.controller';
import { JobsController } from './routes/jobs.controller';
import { ApplicationsController } from './routes/applications.controller';
import { InterviewsController } from './routes/interviews.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: 'apps/gateway/.env' }),

    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
      }),
    }),

    // Timeout of 10 seconds — if a downstream service doesn't respond, fail fast
    HttpModule.register({ timeout: 10000 }),

    // Rate limiting — max 100 requests per minute per IP
    // This protects ALL services at once — one config, everywhere
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
  ],
  controllers: [
    AuthController,
    JobsController,
    ApplicationsController,
    InterviewsController,
  ],
  providers: [
    ProxyService,
    JwtAuthGuard,
    RolesGuard,
    // Apply rate limiting globally to every route in the gateway
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class GatewayModule {}
