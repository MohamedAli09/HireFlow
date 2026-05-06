import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetMyApplicationsQuery } from './get-my-applications.query';
import { Application } from '../application.entity';

@QueryHandler(GetMyApplicationsQuery)
export class GetMyApplicationsHandler implements IQueryHandler<GetMyApplicationsQuery> {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
  ) {}

  execute(query: GetMyApplicationsQuery): Promise<Application[]> {
    return this.applicationRepo.find({ where: { candidateId: query.candidateId } });
  }
}
