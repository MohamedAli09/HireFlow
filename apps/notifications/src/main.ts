import { NestFactory } from '@nestjs/core';
import { NotificationsModule } from './notifications.module';

async function bootstrap() {
  const app = await NestFactory.create(NotificationsModule);
  await app.listen(process.env.port ?? 3000);
  console.log(`Notifications service is running on port ${process.env.port ?? 3000}`);
}
bootstrap();
