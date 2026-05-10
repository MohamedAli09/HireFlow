// apps/jobs/src/main.ts
import { NestFactory } from '@nestjs/core';
import { JobsModule } from './jobs.module';

async function bootstrap() {
  const app = await NestFactory.create(JobsModule);
  const port = process.env.JOBS_SERVICE_PORT ?? 3002;
  await app.listen(port);
  console.log(`Jobs Service running on port ${port}`);
}
void bootstrap();
