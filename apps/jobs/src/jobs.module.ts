import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { Job } from './jobs/job.entity';
import { JobsController } from './jobs.controller';
import { CreateJobHandler } from './jobs/commands/create-job.handler';
import { GetActiveJobsHandler } from './jobs/queries/get-active-jobs.handler';
import { GetJobByIdHandler } from './jobs/queries/get-job-by-id.handler';

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
  ],
  controllers: [JobsController],
  providers: [CreateJobHandler, GetActiveJobsHandler, GetJobByIdHandler],
})
export class JobsModule { }
