// apps/auth/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AuthModule } from './auth.module';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);

  // class-validator runs on every incoming request automatically
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const port = process.env.AUTH_SERVICE_PORT ?? 3001;
  await app.listen(port);
  console.log(`Auth Service running on port ${port}`);
}
void bootstrap();
