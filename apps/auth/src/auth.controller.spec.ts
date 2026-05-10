import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Role } from '@app/common';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  verifyToken: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  describe('register()', () => {
    it('delegates to authService.register and returns its result', async () => {
      mockAuthService.register.mockResolvedValue({ message: 'Registered successfully' });

      const result = await controller.register({ email: 'a@a.com', password: 'secret123' });

      expect(mockAuthService.register).toHaveBeenCalledWith({ email: 'a@a.com', password: 'secret123' });
      expect(result).toEqual({ message: 'Registered successfully' });
    });
  });

  describe('login()', () => {
    it('extracts email and password from body and delegates to authService.login', async () => {
      mockAuthService.login.mockResolvedValue({ accessToken: 'fake.jwt.token' });

      const result = await controller.login({ email: 'a@a.com', password: 'secret123' });

      expect(mockAuthService.login).toHaveBeenCalledWith('a@a.com', 'secret123');
      expect(result).toEqual({ accessToken: 'fake.jwt.token' });
    });
  });

  describe('verify()', () => {
    it('strips "Bearer " prefix and passes raw token to authService.verifyToken', async () => {
      const payload = { sub: '1', email: 'a@a.com', role: Role.CANDIDATE };
      mockAuthService.verifyToken.mockResolvedValue(payload);

      const result = await controller.verify('Bearer fake.jwt.token');

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith('fake.jwt.token');
      expect(result).toEqual(payload);
    });

    it('passes undefined to verifyToken when Authorization header is missing', async () => {
      mockAuthService.verifyToken.mockResolvedValue(null);

      await controller.verify(undefined as any);

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith(undefined);
    });
  });
});
