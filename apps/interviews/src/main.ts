import { NestFactory } from '@nestjs/core';
import { InterviewsModule } from './interviews.module';

async function bootstrap() {
  const app = await NestFactory.create(InterviewsModule);
  const port = process.env.INTERVIEWS_SERVICE_PORT ?? 3002;
  await app.listen(port);
  console.log(`Interviews Service running on port ${port}`);

}
bootstrap();
