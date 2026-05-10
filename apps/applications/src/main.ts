import { NestFactory } from '@nestjs/core';
import { ApplicationsModule } from './applications.module';

async function bootstrap() {
  const app = await NestFactory.create(ApplicationsModule);
  await app.listen(process.env.APPLICATIONS_SERVICE_PORT ?? 3000);
  console.log(
    `Applications Service running on port ${process.env.APPLICATIONS_SERVICE_PORT ?? 3000}`,
  );
}
void bootstrap();
