// apps/auth/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { User } from './users/user.entity';
import { AuthController } from './auth.controller'; 
import { AuthService } from './auth.service';  

@Module({
  imports: [
    // Load .env file before everything else
    ConfigModule.forRoot({ isGlobal: true, envFilePath: 'apps/auth/.env' }),

    // Connect to Auth's own database — nothing else touches this
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        database: config.get('DB_NAME'),
        username: config.get('DB_USER'),
        password: config.get('DB_PASS'),
        entities: [User],
        synchronize: true,  // auto-creates tables in dev — never use in production
      }),
    }),

    TypeOrmModule.forFeature([User]),

    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
 export class AuthModule {}
