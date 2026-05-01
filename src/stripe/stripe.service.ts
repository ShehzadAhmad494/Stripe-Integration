import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
    private stripe: any;

    constructor(private config: ConfigService) {
        this.stripe = new Stripe(
            this.config.get<string>('STRIPE_WEBHOOK_SECRET')!,
            {
                apiVersion: '2026-04-22.dahlia' as any,
            },
        );
    }

    createPaymentIntent(amount: number, currency: string) {
        return this.stripe.paymentIntents.create({
            amount,
            currency,
        });
    }

    constructEvent(rawBody: Buffer, signature: string) {
        return this.stripe.webhooks.constructEvent(
            rawBody,
            signature,
            this.config.get<string>('STRIPE_WEBHOOK_SECRET')!,
        );
    }
}