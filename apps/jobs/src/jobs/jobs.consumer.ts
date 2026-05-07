// apps/jobs/src/jobs/jobs.consumer.ts
import { RabbitSubscribe, AmqpConnection, Nack } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './job.entity';
import { CorrelationLogger } from '@app/common';

interface ApplicationCreatedEvent {
    applicationId: number;
    jobId: number;
    jobTitle: string;
    candidateEmail: string;
    recruiterId: number;
    appliedAt: Date;
    correlationId?: string;
}

@Injectable()
export class JobsConsumer {
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
        const logger = new CorrelationLogger(JobsConsumer.name, event.correlationId ?? 'no-correlation');
        logger.log(`Updating applicant count for job #${event.jobId}`);

        try {
            const job = await this.jobRepo.findOne({ where: { id: event.jobId } });

            if (!job) {
                await this.publishCompensation(event.applicationId, `Job #${event.jobId} not found`, event.correlationId);
                return;
            }

            if (!job.isActive) {
                await this.publishCompensation(event.applicationId, `Job #${event.jobId} is no longer active`, event.correlationId);
                return;
            }

            await this.jobRepo.increment({ id: event.jobId }, 'applicantCount', 1);

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
                    correlationId: event.correlationId,
                },
            );

            logger.log(`Applicant count updated for job #${event.jobId}`);
        } catch (error) {
            logger.error(`Failed to update applicant count: ${error.message}`);
            const isTransient = error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT';
            return new Nack(isTransient);
        }
    }

    private async publishCompensation(applicationId: number, reason: string, correlationId?: string): Promise<void> {
        const logger = new CorrelationLogger(JobsConsumer.name, correlationId ?? 'no-correlation');
        await this.amqpConnection.publish(
            'hireflow.exchange',
            'applicant.count.failed',
            { applicationId, reason, correlationId },
        );
        logger.warn(`Compensation event published for application #${applicationId}: ${reason}`);
    }
}
