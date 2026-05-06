import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetMyInterviewsQuery } from './get-my-interviews.query';
import { Interview } from '../interview.entity';

@QueryHandler(GetMyInterviewsQuery)
export class GetMyInterviewsHandler implements IQueryHandler<GetMyInterviewsQuery> {
  constructor(
    @InjectRepository(Interview)
    private readonly interviewRepo: Repository<Interview>,
  ) {}

  execute(query: GetMyInterviewsQuery): Promise<Interview[]> {
    return this.interviewRepo.find({
      where: { recruiterId: query.recruiterId },
      order: { scheduledAt: 'ASC' },
    });
  }
}
