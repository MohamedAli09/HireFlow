import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateJobCommand } from './create-job.command';
import { Job } from '../job.entity';
import { CorrelationLogger } from '@app/common';

@CommandHandler(CreateJobCommand)
export class CreateJobHandler implements ICommandHandler<CreateJobCommand> {
    constructor(
        @InjectRepository(Job)
        private readonly jobRepo: Repository<Job>,
    ) { }

    async execute(command: CreateJobCommand): Promise<Job> {
        const logger = new CorrelationLogger(CreateJobHandler.name, command.correlationId ?? 'no-correlation');

        const job = this.jobRepo.create({
            title: command.title,
            description: command.description,
            location: command.location,
            recruiterId: command.recruiterId,
            salaryMin: command.salaryMin,
            salaryMax: command.salaryMax,
        });

        const saved = await this.jobRepo.save(job);
        logger.log(`Job #${saved.id} "${saved.title}" created by recruiter #${command.recruiterId}`);

        return saved;
    }
}
