import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateJobCommand } from './create-job.command';
import { Job } from '../job.entity';

@CommandHandler(CreateJobCommand)
export class CreateJobHandler implements ICommandHandler<CreateJobCommand> {
    constructor(
        @InjectRepository(Job)
        private readonly jobRepo: Repository<Job>,
    ) { }

    async execute(command: CreateJobCommand): Promise<Job> {
        // The handler owns the write logic completely.
        // It uses the full Job entity with all its fields and validation.
        const job = this.jobRepo.create({
            title: command.title,
            description: command.description,
            location: command.location,
            recruiterId: command.recruiterId,
            salaryMin: command.salaryMin,
            salaryMax: command.salaryMax,
        });

        return this.jobRepo.save(job);
    }
}