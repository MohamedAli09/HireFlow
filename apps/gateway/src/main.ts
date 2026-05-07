// apps/gateway/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { GatewayModule } from './gateway.module';
import { CorrelationIdMiddleware } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);

  // Apply correlation ID middleware before anything else runs
  // Order matters — this must come before guards and interceptors
  app.use(new CorrelationIdMiddleware().use.bind(new CorrelationIdMiddleware()));

  app.enableCors({ origin: 'http://localhost:5173', credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  await app.listen(process.env.GATEWAY_PORT ?? 3000);
  console.log('API Gateway running on port 3000');
}
bootstrap();