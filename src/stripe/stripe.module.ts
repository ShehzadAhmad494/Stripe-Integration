import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  providers: [StripeService],
  imports:[ConfigModule],
  controllers: [StripeController],
  exports: [StripeService],
})
export class StripeModule {}
