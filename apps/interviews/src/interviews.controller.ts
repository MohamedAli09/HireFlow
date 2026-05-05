import { Controller, Post, Get, Body } from '@nestjs/common';
import { InterviewsService, ScheduleInterviewDto } from './interviews.service';
import { CurrentUser, UserPayload } from '@app/common';

@Controller('interviews')
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) { }


  @Post()
  schedule(@Body() dto: ScheduleInterviewDto, @CurrentUser() user: UserPayload) {
    return this.interviewsService.schedule(dto, user);
  }

  @Get('my')
  myInterviews(@CurrentUser() user: UserPayload) {
    return this.interviewsService.findByRecruiter(+user.sub);
  }
}