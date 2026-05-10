import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsController } from './applications.controller';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Role, UserPayload } from '@app/common';

const mockCommandBus = {
    execute: jest.fn(),
};
const mockQueryBus = {
    execute: jest.fn(),
};

describe('ApplicationsController', () => {
    let controller: ApplicationsController;
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ApplicationsController],
            providers: [
                { provide: CommandBus, useValue: mockCommandBus },
                { provide: QueryBus, useValue: mockQueryBus },
            ],
        }).compile();

        controller = module.get<ApplicationsController>(ApplicationsController);
        jest.clearAllMocks();
    });

    describe('apply()', () => {
        it('should call commandBus.execute with an instance of ApplyCommand', async () => {
            mockCommandBus.execute.mockResolvedValue({ id: 1, jobId: 123, candidateId: 456 });
            const body = { jobId: 123 };
            const user: UserPayload = { sub: '456', email: 'user@example.com', role: Role.CANDIDATE };
            const correlationId = 'corr-id-789';
            await controller.apply(body, user, correlationId);
            expect(mockCommandBus.execute).toHaveBeenCalledWith(expect.objectContaining({
                jobId: 123,
                candidateId: 456,
                candidateEmail: 'user@example.com',
                correlationId: 'corr-id-789',
            }));



        });
    });

    describe('myApplications()', () => {
        it('should call queryBus.execute with an instance of GetMyApplicationsQuery', async () => {
            mockQueryBus.execute.mockResolvedValue([{ jobId: 123, candidateId: 456 }]);
            const user: UserPayload = { sub: '456', email: 'user @example.com', role: Role.CANDIDATE };
            await controller.myApplications(user);
            expect(mockQueryBus.execute).toHaveBeenCalledWith(expect.objectContaining({
                candidateId: 456,
            }));
        });
    });
});

