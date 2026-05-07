import { Logger } from '@nestjs/common';

export class CorrelationLogger extends Logger {
    private correlationId: string;

    constructor(context: string, correlationId: string) {
        super(context);
        this.correlationId = correlationId;
    }

    // Override every log method to prepend the correlation ID
    log(message: string): void {
        super.log(`[${this.correlationId}] ${message}`);
    }

    warn(message: string): void {
        super.warn(`[${this.correlationId}] ${message}`);
    }

    error(message: string): void {
        super.error(`[${this.correlationId}] ${message}`);
    }
}