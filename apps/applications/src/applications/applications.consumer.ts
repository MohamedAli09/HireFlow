// apps/applications/src/applications/applications.consumer.ts
import { RabbitSubscribe, Nack } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application, ApplicationStatus } from './application.entity';

interface ApplicantCountFailedEvent {
    applicationId: number;
    reason: string;
}

@Injectable()
export class ApplicationsConsumer {
    private readonly logger = new Logger(ApplicationsConsumer.name);

    constructor(
        @InjectRepository(Application)
        private readonly applicationRepo: Repository<Application>,
    ) { }

    // This is the compensation handler.
    // When Jobs Service fails to update the count, it publishes this event.
    // Applications Service listens and cancels the application — restoring consistency.
    @RabbitSubscribe({
        exchange: 'hireflow.exchange',
        routingKey: 'applicant.count.failed',
        queue: 'applications.applicant.count.failed', 
    })
    async handleApplicantCountFailed(event: ApplicantCountFailedEvent): Promise<void | Nack> {
        this.logger.warn(
            `Compensation triggered for application #${event.applicationId}: ${event.reason}`
        );

        try {
            await this.applicationRepo.update(
                { id: event.applicationId },
                { status: ApplicationStatus.CANCELLED },
            );

            this.logger.warn(
                `Application #${event.applicationId} cancelled — data consistent again`
            );

            // Internal alert — in production this would page your engineering team
            this.logger.error(
                `SAGA COMPENSATION: application #${event.applicationId} cancelled due to: ${event.reason}`
            );
        } catch (error) {
            this.logger.error(`Compensation failed: ${error.message}`);
            // Nack tells RabbitMQ to requeue this message and retry
            // We never want to lose a compensation event
            return new Nack(true);
        }
    }
}