import { Controller, Post, Body, Req, Headers } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { StripeService } from '../stripe/stripe.service';

@Controller('payment')
export class PaymentController {
  constructor(
    private paymentService: PaymentService,
    private stripeService: StripeService,
  ) {}

  @Post('create-intent')
  create(@Body() body: { amount: number; currency: string }) {
    return this.paymentService.createPayment(body.amount, body.currency);
  }

  @Post('webhook')
  webhook(@Req() req: any, @Headers('stripe-signature') sig: string) {
    const event = this.stripeService.constructEvent(req.rawBody, sig);

    this.paymentService.handleWebhook(event);

    return { received: true };
  }
}