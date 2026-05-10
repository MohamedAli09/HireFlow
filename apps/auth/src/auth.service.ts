// apps/auth/src/auth/auth.service.ts
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { Role, UserPayload } from '@app/common';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    // bcrypt with cost factor 10 — strong enough, not too slow
    const hashed = await bcrypt.hash(dto.password, 10);

    const user = this.userRepo.create({
      email: dto.email,
      password: hashed,
      role: dto.role ?? Role.CANDIDATE,
    });

    await this.userRepo.save(user);
    return { message: 'Registered successfully' };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string }> {
    const user = await this.userRepo.findOne({ where: { email } });

    // Same error for "user not found" and "wrong password" — prevents email enumeration
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: UserPayload = {
      sub: String(user.id),
      email: user.email,
      role: user.role,
    };
    return { accessToken: this.jwtService.sign(payload) };
  }

  // This endpoint is critical — other services will call it over HTTP to verify tokens.
  // It returns the decoded payload so the caller knows who this token belongs to.
  verifyToken(token: string): UserPayload {
    try {
      return this.jwtService.verify<UserPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
