import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';

// This is the shape of the event Applications Service publishes.
// Both services agree on this contract — it's what makes event-driven work.
interface ApplicationCreatedEvent {
    applicationId: number;
    jobId: number;
    jobTitle: string;
    candidateEmail: string;
    recruiterId: number;
    appliedAt: Date;
}

@Injectable()
export class NotificationsConsumer {
    private readonly logger = new Logger(NotificationsConsumer.name);

    // @RabbitSubscribe tells NestJS: "whenever a message with routing key
    // 'application.created' arrives on 'hireflow.exchange', call this method."
    // The queue name is unique to this consumer — multiple consumers can each
    // have their own queue receiving the same events independently.
    @RabbitSubscribe({
        exchange: 'hireflow.exchange',
        routingKey: 'application.created',
        queue: 'notifications.application.created',
    })
    async handleApplicationCreated(event: ApplicationCreatedEvent): Promise<void> {
        this.logger.log(`Processing application.created for job: ${event.jobTitle}`);

        // In a real system, you'd use Nodemailer or SendGrid here.
        // For now, we log the email that would be sent so you can see the flow working.
        this.logger.log(
            `📧 EMAIL TO RECRUITER (id: ${event.recruiterId}): ` +
            `"${event.candidateEmail}" just applied to "${event.jobTitle}" ` +
            `(Application #${event.applicationId})`
        );

        // The beauty of this: if this method throws an error, RabbitMQ
        // automatically requeues the message and retries. Nothing is lost.
    }

    @RabbitSubscribe({
        exchange: 'hireflow',
        routingKey: 'interview.scheduled',
        queue: 'notifications.interview.scheduled',
    })
    async handleInterviewScheduled(event: {
        interviewId: number;
        candidateEmail: string;
        jobTitle: string;
        scheduledAt: string;
        meetingLink?: string;
    }): Promise<void> {
        this.logger.log(
            `📧 EMAIL TO CANDIDATE (${event.candidateEmail}): ` +
            `Interview scheduled for "${event.jobTitle}" on ${event.scheduledAt}. ` +
            `${event.meetingLink ? 'Meeting link: ' + event.meetingLink : ''}`,
        );
    }
}