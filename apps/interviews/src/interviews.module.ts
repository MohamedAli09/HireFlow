import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Interview } from './interviews/interview.entity';
import { InterviewsController } from './interviews.controller';
import { ScheduleInterviewHandler } from './interviews/commands/schedule-interview.handler';
import { GetMyInterviewsHandler } from './interviews/queries/get-my-interviews.handler';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: 'apps/interviews/.env' }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        database: config.get('DB_NAME'),
        username: config.get('DB_USER'),
        password: config.get('DB_PASS'),
        entities: [Interview],
        synchronize: true,
      }),
    }),

    TypeOrmModule.forFeature([Interview]),
    CqrsModule,

    RabbitMQModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        exchanges: [{ name: 'hireflow', type: 'topic' }],
        uri: config.get('RABBITMQ_URL')!,
        connectionInitOptions: { wait: false },
      }),
    }),
  ],
  controllers: [InterviewsController],
  providers: [ScheduleInterviewHandler, GetMyInterviewsHandler],
})
export class InterviewsModule {}
