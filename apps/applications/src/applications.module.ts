import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { Application } from './applications/application.entity';
import { GatewayUserGuard } from './auth/gateway-user.guard';
import { JobsClient } from './jobs/jobs.client';

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
  providers: [ApplicationsService, GatewayUserGuard, JobsClient],
})
export class ApplicationsModule {}
