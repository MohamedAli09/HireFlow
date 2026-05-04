import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

describe('ApplicationsController', () => {
  let applicationsController: ApplicationsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [ApplicationsService],
    }).compile();

    applicationsController = app.get<ApplicationsController>(ApplicationsController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(applicationsController.getHello()).toBe('Hello World!');
    });
  });
});
