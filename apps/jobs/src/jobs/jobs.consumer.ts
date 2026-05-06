// apps/jobs/src/jobs/jobs.consumer.ts
import { RabbitSubscribe, AmqpConnection, Nack } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './job.entity';

interface ApplicationCreatedEvent {
    applicationId: number;
    jobId: number;
    jobTitle: string;
    candidateEmail: string;
    recruiterId: number;
    appliedAt: Date;
}

@Injectable()
export class JobsConsumer {
    private readonly logger = new Logger(JobsConsumer.name);

    constructor(
        @InjectRepository(Job)
        private readonly jobRepo: Repository<Job>,
        private readonly amqpConnection: AmqpConnection,
    ) { }

    @RabbitSubscribe({
        exchange: 'hireflow.exchange',
        routingKey: 'application.created',
        queue: 'jobs.application.created',
        queueOptions: {
            deadLetterExchange: 'hireflow.dlx',
            deadLetterRoutingKey: 'jobs.application.created.dead',
        },
    })
    async handleApplicationCreated(event: ApplicationCreatedEvent): Promise<void | Nack> {
        this.logger.log(`Updating applicant count for job #${event.jobId}`);

        try {
            const job = await this.jobRepo.findOne({ where: { id: event.jobId } });

            if (!job) {
                // Job doesn't exist — this is a permanent failure, no point retrying.
                // Trigger compensation immediately.
                await this.publishCompensation(event.applicationId, `Job #${event.jobId} not found`);
                return;
            }

            if (!job.isActive) {
                // Job was closed between application submission and this event being processed.
                // Trigger compensation — application should be cancelled.
                await this.publishCompensation(event.applicationId, `Job #${event.jobId} is no longer active`);
                return;
            }

            // Happy path — increment the count
            await this.jobRepo.increment({ id: event.jobId }, 'applicantCount', 1);

            // Publish success event — triggers next step (Notifications emails recruiter)
            await this.amqpConnection.publish(
                'hireflow.exchange',
                'applicant.count.updated',
                {
                    applicationId: event.applicationId,
                    jobId: event.jobId,
                    jobTitle: event.jobTitle,
                    candidateEmail: event.candidateEmail,
                    recruiterId: event.recruiterId,
                    appliedAt: event.appliedAt,
                },
            );

            this.logger.log(`Applicant count updated for job #${event.jobId} ✅`);
        } catch (error) {
            this.logger.error(`Failed to update applicant count: ${error.message}`);

            // Only requeue for transient failures (connection lost, timeout).
            // Query errors (wrong column, constraint violation) are permanent — dead-letter them
            // so they don't spin in an infinite retry loop.
            const isTransient = error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT';
            return new Nack(isTransient);
        }
    }

    private async publishCompensation(applicationId: number, reason: string): Promise<void> {
        await this.amqpConnection.publish(
            'hireflow.exchange',
            'applicant.count.failed',   // compensation event — Applications Service listens
            { applicationId, reason },
        );
        this.logger.warn(`Compensation event published for application #${applicationId}`);
    }
}