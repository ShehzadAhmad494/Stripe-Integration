import { Injectable } from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service';

@Injectable()
export class PaymentService {
  constructor(private stripe: StripeService) {}

  async createPayment(amount: number, currency: string) {
    const intent = await this.stripe.createPaymentIntent(amount, currency);

    return {
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amount:intent.amount,
      currency:intent.currency,
      status:intent.status,
    };
  }

  handleWebhook(event: any) {
    if (event.type === 'payment_intent.succeeded') {
      console.log('Payment Successful:', event.data.object.id);
    }
  }
}