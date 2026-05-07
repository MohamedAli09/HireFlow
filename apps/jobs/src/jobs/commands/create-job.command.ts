
export class CreateJobCommand {
    constructor(
        // Everything the handler needs to create the job.
        // Notice this is just a plain class — no decorators, no NestJS magic.
        // It's a simple data container that describes the intention.
        public readonly title: string,
        public readonly description: string,
        public readonly location: string,
        public readonly recruiterId: number,
        public readonly salaryMin?: number,
        public readonly salaryMax?: number,
        public readonly correlationId?: string,
    ) { }
}