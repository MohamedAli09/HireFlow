import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { CqrsModule } from '@nestjs/cqrs';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ApplicationsController } from './applications.controller';
import { Application } from './applications/application.entity';
import { GatewayUserGuard } from './auth/gateway-user.guard';
import { JobsClient } from './jobs/jobs.client';
import { ApplyHandler } from './applications/commands/apply.handler';
import { GetMyApplicationsHandler } from './applications/queries/get-my-applications.handler';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: 'apps/applications/.env' }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        database: config.get('DB_NAME'),
        username: config.get('DB_USER'),
        password: config.get('DB_PASS'),
        entities: [Application],
        synchronize: true,
      }),
    }),

    TypeOrmModule.forFeature([Application]),
    HttpModule,
    CqrsModule,

    RabbitMQModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        exchanges: [{ name: 'hireflow.exchange', type: 'topic' }],
        uri: config.get<string>('RABBITMQ_URL')!,
        connectionInitOptions: { wait: false },
      }),
    }),
  ],
  controllers: [ApplicationsController],
  providers: [GatewayUserGuard, JobsClient, ApplyHandler, GetMyApplicationsHandler],
})
export class ApplicationsModule {}
