import { RabbitSubscribe, Nack } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';

// This is the shape of the event Applications Service publishes.
// Both services agree on this contract — it's what makes event-driven work.


@Injectable()
export class NotificationsConsumer {
    private readonly logger = new Logger(NotificationsConsumer.name);

    // @RabbitSubscribe tells NestJS: "whenever a message with routing key
    // 'application.created' arrives on 'hireflow.exchange', call this method."
    // The queue name is unique to this consumer — multiple consumers can each
    // have their own queue receiving the same events independently.
    // apps/notifications/src/notifications/notifications.consumer.ts
    // Replace the application.created handler with applicant.count.updated

    @RabbitSubscribe({
        exchange: 'hireflow.exchange',
        routingKey: 'applicant.count.updated',
        queue: 'notifications.applicant.count.updated',
        queueOptions: {
            deadLetterExchange: 'hireflow.dlx',
            deadLetterRoutingKey: 'notifications.applicant.count.updated.dead',
        },
    })
    async handleApplicantCountUpdated(event: {
        applicationId: number;
        jobTitle: string;
        candidateEmail: string;
        recruiterId: number;
    }): Promise<void | Nack> {
        this.logger.log(`Sending recruiter notification for application #${event.applicationId}`);

        try {
            this.logger.log(
                `📧 EMAIL TO RECRUITER (id: ${event.recruiterId}): ` +
                `"${event.candidateEmail}" applied to "${event.jobTitle}" ` +
                `(Application #${event.applicationId})`
            );
        } catch (error) {
            this.logger.error(`Failed to send recruiter notification: ${error.message}`);
            const isTransient = error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT';
            return new Nack(isTransient);
        }
    }

    @RabbitSubscribe({
        exchange: 'hireflow.exchange',
        routingKey: 'interview.scheduled',
        queue: 'notifications.interview.scheduled',
        queueOptions: {
            deadLetterExchange: 'hireflow.dlx',
            deadLetterRoutingKey: 'notifications.interview.scheduled.dead',
        },
    })
    async handleInterviewScheduled(event: {
        interviewId: number;
        candidateEmail: string;
        jobTitle: string;
        scheduledAt: string;
        meetingLink?: string;
    }): Promise<void | Nack> {
        try {
            this.logger.log(
                `📧 EMAIL TO CANDIDATE (${event.candidateEmail}): ` +
                `Interview scheduled for "${event.jobTitle}" on ${event.scheduledAt}. ` +
                `${event.meetingLink ? 'Meeting link: ' + event.meetingLink : ''}`,
            );
        } catch (error) {
            this.logger.error(`Failed to send candidate notification: ${error.message}`);
            const isTransient = error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT';
            return new Nack(isTransient);
        }
    }
}