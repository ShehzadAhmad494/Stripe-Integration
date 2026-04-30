import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { StripeModule } from 'src/stripe/stripe.module';


@Module({
  imports: [StripeModule],
  controllers: [PaymentController],
  providers: [PaymentService]
})
export class PaymentModule {}
