// apps/gateway/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { GatewayModule } from './gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);

  // CORS configured once here — removed from all individual services
  app.enableCors({
    origin: 'http://localhost:5173', // your React dev server
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const port = process.env.GATEWAY_PORT ?? 3000;
  await app.listen(port);
  console.log(`API Gateway running on port ${port}`);
}
bootstrap();