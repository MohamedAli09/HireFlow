import { NestFactory } from '@nestjs/core';
import { ApplicationsModule } from './applications.module';

async function bootstrap() {
  const app = await NestFactory.create(ApplicationsModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
