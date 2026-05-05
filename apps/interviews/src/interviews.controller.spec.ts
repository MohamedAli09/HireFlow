import { Test, TestingModule } from '@nestjs/testing';
import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './interviews.service';

describe('InterviewsController', () => {
  let interviewsController: InterviewsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [InterviewsController],
      providers: [InterviewsService],
    }).compile();

    interviewsController = app.get<InterviewsController>(InterviewsController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(interviewsController.getHello()).toBe('Hello World!');
    });
  });
});
