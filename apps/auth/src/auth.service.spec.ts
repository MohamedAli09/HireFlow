import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from './users/user.entity';
import { Role } from '@app/common';

const mockUserRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('register()', () => {
    it('returns success message when email is not taken', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.create.mockReturnValue({
        email: 'a@a.com',
        password: 'hashed',
        role: Role.CANDIDATE,
      });
      mockUserRepo.save.mockResolvedValue({});

      const result = await service.register({
        email: 'a@a.com',
        password: 'secret123',
      });

      expect(result).toEqual({ message: 'Registered successfully' });
    });

    it('throws ConflictException when email is already registered', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 1, email: 'a@a.com' });

      await expect(
        service.register({ email: 'a@a.com', password: 'secret123' }),
      ).rejects.toThrow(ConflictException);
    });

    it('hashes the password before saving — never stores plaintext', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.create.mockImplementation(
        (data: Record<string, unknown>) => data,
      );
      mockUserRepo.save.mockResolvedValue({});

      await service.register({ email: 'a@a.com', password: 'secret123' });

      const [[savedUser]] = mockUserRepo.create.mock.calls as [
        [{ password: string; role: Role }],
      ];
      expect(savedUser.password).not.toBe('secret123');

      const isHashed = await bcrypt.compare('secret123', savedUser.password);
      expect(isHashed).toBe(true);
    });

    it('defaults role to CANDIDATE when role is not provided', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.create.mockImplementation(
        (data: Record<string, unknown>) => data,
      );
      mockUserRepo.save.mockResolvedValue({});

      await service.register({ email: 'a@a.com', password: 'secret123' });

      const [[savedUser]] = mockUserRepo.create.mock.calls as [
        [{ password: string; role: Role }],
      ];
      expect(savedUser.role).toBe(Role.CANDIDATE);
    });

    it('saves the user with the provided role when role is given', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.create.mockImplementation(
        (data: Record<string, unknown>) => data,
      );
      mockUserRepo.save.mockResolvedValue({});

      await service.register({
        email: 'r@r.com',
        password: 'secret123',
        role: Role.RECRUITER,
      });

      const [[savedUser]] = mockUserRepo.create.mock.calls as [
        [{ password: string; role: Role }],
      ];
      expect(savedUser.role).toBe(Role.RECRUITER);
    });
  });

  describe('login()', () => {
    it('returns an accessToken when credentials are correct', async () => {
      const hashedPassword = await bcrypt.hash('secret123', 10);
      mockUserRepo.findOne.mockResolvedValue({
        id: 1,
        email: 'a@a.com',
        password: hashedPassword,
        role: Role.CANDIDATE,
      });
      mockJwtService.sign.mockReturnValue('fake.jwt.token');

      const result = await service.login('a@a.com', 'secret123');

      expect(result).toEqual({ accessToken: 'fake.jwt.token' });
    });

    it('throws UnauthorizedException when user does not exist', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login('ghost@ghost.com', 'secret123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      const hashedPassword = await bcrypt.hash('correct-password', 10);
      mockUserRepo.findOne.mockResolvedValue({
        id: 1,
        email: 'a@a.com',
        password: hashedPassword,
        role: Role.CANDIDATE,
      });

      await expect(service.login('a@a.com', 'wrong-password')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('signs the JWT with the correct payload shape', async () => {
      const hashedPassword = await bcrypt.hash('secret123', 10);
      mockUserRepo.findOne.mockResolvedValue({
        id: 42,
        email: 'a@a.com',
        password: hashedPassword,
        role: Role.RECRUITER,
      });
      mockJwtService.sign.mockReturnValue('fake.jwt.token');

      await service.login('a@a.com', 'secret123');

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: '42',
        email: 'a@a.com',
        role: Role.RECRUITER,
      });
    });
  });

  describe('verifyToken()', () => {
    it('returns the decoded payload for a valid token', () => {
      const payload = { sub: '1', email: 'a@a.com', role: Role.CANDIDATE };
      mockJwtService.verify.mockReturnValue(payload);

      const result = service.verifyToken('valid.token');

      expect(result).toEqual(payload);
    });

    it('throws UnauthorizedException when token is invalid or expired', () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      expect(() => service.verifyToken('bad.token')).toThrow(
        UnauthorizedException,
      );
    });
  });
});
