// apps/applications/src/applications/applications.consumer.ts
import { RabbitSubscribe, Nack } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application, ApplicationStatus } from './application.entity';
import { CorrelationLogger } from '@app/common';

interface ApplicantCountFailedEvent {
    applicationId: number;
    reason: string;
    correlationId?: string;
}

@Injectable()
export class ApplicationsConsumer {
    constructor(
        @InjectRepository(Application)
        private readonly applicationRepo: Repository<Application>,
    ) { }

    @RabbitSubscribe({
        exchange: 'hireflow.exchange',
        routingKey: 'applicant.count.failed',
        queue: 'applications.applicant.count.failed',
        queueOptions: {
            deadLetterExchange: 'hireflow.dlx',
            deadLetterRoutingKey: 'applications.applicant.count.failed.dead',
        },
    })
    async handleApplicantCountFailed(event: ApplicantCountFailedEvent): Promise<void | Nack> {
        const logger = new CorrelationLogger(ApplicationsConsumer.name, event.correlationId ?? 'no-correlation');
        logger.warn(`Compensation triggered for application #${event.applicationId}: ${event.reason}`);

        try {
            await this.applicationRepo.update(
                { id: event.applicationId },
                { status: ApplicationStatus.CANCELLED },
            );

            logger.warn(`Application #${event.applicationId} cancelled — data consistent again`);
            logger.error(`SAGA COMPENSATION: application #${event.applicationId} cancelled due to: ${event.reason}`);
        } catch (error) {
            logger.error(`Compensation failed: ${error.message}`);
            const isTransient = error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT';
            return new Nack(isTransient);
        }
    }
}
