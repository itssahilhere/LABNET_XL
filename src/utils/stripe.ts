import Stripe from 'stripe';
import { logError } from './logger';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-09-30.clover'
});

export interface StripeCheckoutSessionData {
    packageId: string;
    packageName: string;
    packagePrice: number;
    customerEmail: string;
    userId: string;
    successUrl: string;
    cancelUrl: string;
}

export class StripeService {
    /**
     * Create a Stripe checkout session for package purchase
     */
    static async createCheckoutSession(data: StripeCheckoutSessionData): Promise<Stripe.Checkout.Session> {
        try {
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: data.packageName,
                                description: `LabnetXL Package: ${data.packageName}`,
                            },
                            unit_amount: Math.round(data.packagePrice * 100), // Convert to cents
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: data.successUrl,
                cancel_url: data.cancelUrl,
                customer_email: data.customerEmail,
                metadata: {
                    package_id: data.packageId,
                    user_id: data.userId,
                    source: 'labnetxl_package_purchase'
                },
                expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
            });

            return session;
        } catch (error: any) {
            logError({
                userId: data.userId,
                functionName: 'createCheckoutSession',
                errorMsg: `Stripe checkout session creation failed: ${error.message}`
            });
            throw new Error(`Payment session creation failed: ${error.message}`);
        }
    }

    /**
     * Verify webhook signature for security
     */
    static verifyWebhookSignature(payload: string, signature: string, endpointSecret: string): Stripe.Event {
        try {
            const event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
            return event;
        } catch (error: any) {
            logError({
                userId: 'webhook',
                functionName: 'verifyWebhookSignature',
                errorMsg: `Webhook signature verification failed: ${error.message}`
            });
            throw new Error(`Webhook signature verification failed: ${error.message}`);
        }
    }
}

export default stripe;