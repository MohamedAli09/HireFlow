import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Job } from './jobs/job.entity';
import { JobsController } from './jobs.controller';
import { CreateJobHandler } from './jobs/commands/create-job.handler';
import { GetActiveJobsHandler } from './jobs/queries/get-active-jobs.handler';
import { GetJobByIdHandler } from './jobs/queries/get-job-by-id.handler';
import { JobsConsumer } from './jobs/jobs.consumer';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: 'apps/jobs/.env' }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        database: config.get('DB_NAME'),
        username: config.get('DB_USER'),
        password: config.get('DB_PASS'),
        entities: [Job],
        synchronize: true,
      }),
    }),

    TypeOrmModule.forFeature([Job]),
    CqrsModule,

    RabbitMQModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        exchanges: [
          { name: 'hireflow.exchange', type: 'topic' },
          { name: 'hireflow.dlx', type: 'topic' },
        ],
        uri: config.get<string>('RABBITMQ_URL')!,
        connectionInitOptions: { wait: false },
        // Process one message at a time — prevents parallel retry storms when DB is broken.
        prefetchCount: 1,
      }),
    }),
  ],
  controllers: [JobsController],
  providers: [CreateJobHandler, GetActiveJobsHandler, GetJobByIdHandler, JobsConsumer],
})
export class JobsModule { }
