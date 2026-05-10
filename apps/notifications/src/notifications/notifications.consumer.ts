import { RabbitSubscribe, Nack } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { CorrelationLogger } from '@app/common';

@Injectable()
export class NotificationsConsumer {
  @RabbitSubscribe({
    exchange: 'hireflow.exchange',
    routingKey: 'applicant.count.updated',
    queue: 'notifications.applicant.count.updated',
    queueOptions: {
      deadLetterExchange: 'hireflow.dlx',
      deadLetterRoutingKey: 'notifications.applicant.count.updated.dead',
    },
  })
  handleApplicantCountUpdated(event: {
    applicationId: number;
    jobTitle: string;
    candidateEmail: string;
    recruiterId: number;
    correlationId?: string;
  }): void | Nack {
    const logger = new CorrelationLogger(
      NotificationsConsumer.name,
      event.correlationId ?? 'no-correlation',
    );
    logger.log(
      `Sending recruiter notification for application #${event.applicationId}`,
    );

    try {
      logger.log(
        `EMAIL TO RECRUITER (id: ${event.recruiterId}): ` +
          `"${event.candidateEmail}" applied to "${event.jobTitle}" ` +
          `(Application #${event.applicationId})`,
      );
    } catch (error: unknown) {
      const err = error as Error & { code?: string };
      logger.error(`Failed to send recruiter notification: ${err.message}`);
      const isTransient =
        err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT';
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
  handleInterviewScheduled(event: {
    interviewId: number;
    candidateEmail: string;
    jobTitle: string;
    scheduledAt: string;
    meetingLink?: string;
    correlationId?: string;
  }): void | Nack {
    const logger = new CorrelationLogger(
      NotificationsConsumer.name,
      event.correlationId ?? 'no-correlation',
    );

    try {
      logger.log(
        `EMAIL TO CANDIDATE (${event.candidateEmail}): ` +
          `Interview scheduled for "${event.jobTitle}" on ${event.scheduledAt}. ` +
          `${event.meetingLink ? 'Meeting link: ' + event.meetingLink : ''}`,
      );
    } catch (error: unknown) {
      const err = error as Error & { code?: string };
      logger.error(`Failed to send candidate notification: ${err.message}`);
      const isTransient =
        err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT';
      return new Nack(isTransient);
    }
  }
}
