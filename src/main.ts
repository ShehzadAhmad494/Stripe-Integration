import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // 👈 IMPORTANT for Stripe
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();