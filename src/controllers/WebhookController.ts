import { Request, Response } from 'express';
import Stripe from 'stripe';
import mongoose from 'mongoose';
import User from '../models/User.model';
import Package from '../models/Package.model';
import PackActive from '../models/PackActive.model';
import PaymentLog from '../models/PaymentLog.model';
import { StripeService } from '../utils/stripe';
import { logError, logSuccess } from '../utils/logger';

export class WebhookController {
  /**
   * Handle Stripe webhook events
   */
  public async stripeWebhook(req: Request, res: Response): Promise<Response> {
    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = StripeService.verifyWebhookSignature(req.body, sig, endpointSecret);
    } catch (err: any) {
      logError({
        userId: 'webhook',
        functionName: 'stripeWebhook',
        errorMsg: `Webhook signature verification failed: ${err.message}`,
      });
      return res.status(400).json({ error: 'Webhook signature verification failed' });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return res.status(200).json({ received: true });
  }

  /**
   * Handle successful checkout session completion
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    try {
      const userId = session.metadata?.user_id;
      const packageId = session.metadata?.package_id;

      if (!userId || !packageId) {
        throw new Error('Missing user_id or package_id in session metadata');
      }

      // Find user and package
      const [user, packageData] = await Promise.all([
        User.findById(userId),
        Package.findById(packageId),
      ]);

      if (!user || !packageData) {
        throw new Error('User or package not found');
      }

      // Calculate package end date
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + packageData.duration_days);

      // Update user's package information
      if (!user.package) {
        user.package = {};
      }
      user.package.id = packageData._id as mongoose.Types.ObjectId;
      user.package.start_date = startDate;
      user.package.end_date = endDate;
      await user.save();

      // Find the payment log to get payment_id
      const paymentLog = await PaymentLog.findOne({ stripe_session_id: session.id });

      if (!paymentLog) {
        throw new Error('Payment log not found for session');
      }

      // Create PackActive record
      const packActive = new PackActive({
        user_id: userId,
        pack_id: packageId,
        payment_id: paymentLog.payment_id,
        amount: packageData.amount,
        pack_type: packageData.pack_type,
        payment_type: 'Stripe',
        activated_at: startDate,
        expires_at: endDate,
        is_active: true,
      });
      await packActive.save();

      // Update payment log
      await PaymentLog.findOneAndUpdate(
        { stripe_session_id: session.id },
        {
          payment_status: 'completed',
          stripe_status: 'paid',
        }
      );

      logSuccess({
        userId: userId,
        functionName: 'handleCheckoutCompleted',
        successMsg: `Package ${packageData.name} activated successfully for user ${user.email}`,
      });
    } catch (error: any) {
      logError({
        userId: session.metadata?.user_id || 'unknown',
        functionName: 'handleCheckoutCompleted',
        errorMsg: `Checkout completion handling failed: ${error.message}`,
      });
    }
  }

  /**
   * Handle successful payment intent
   */
  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      const userId = paymentIntent.metadata?.user_id;
      const packageId = paymentIntent.metadata?.package_id;

      if (!userId || !packageId) {
        return; // Skip if no metadata
      }

      // Update payment log if exists
      await PaymentLog.findOneAndUpdate(
        { stripe_session_id: paymentIntent.id },
        {
          payment_status: 'completed',
          stripe_status: 'succeeded',
        }
      );

      logSuccess({
        userId: userId,
        functionName: 'handlePaymentSucceeded',
        successMsg: `Payment succeeded for amount ${paymentIntent.amount / 100}`,
      });
    } catch (error: any) {
      logError({
        userId: paymentIntent.metadata?.user_id || 'unknown',
        functionName: 'handlePaymentSucceeded',
        errorMsg: `Payment success handling failed: ${error.message}`,
      });
    }
  }

  /**
   * Handle failed payment intent
   */
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      const userId = paymentIntent.metadata?.user_id;

      // Update payment log if exists
      await PaymentLog.findOneAndUpdate(
        { stripe_session_id: paymentIntent.id },
        {
          payment_status: 'failed',
          stripe_status: 'failed',
          error_message: paymentIntent.last_payment_error?.message || 'Payment failed',
        }
      );

      logError({
        userId: userId || 'unknown',
        functionName: 'handlePaymentFailed',
        errorMsg: `Payment failed for amount ${paymentIntent.amount / 100}`,
      });
    } catch (error: any) {
      logError({
        userId: paymentIntent.metadata?.user_id || 'unknown',
        functionName: 'handlePaymentFailed',
        errorMsg: `Payment failure handling failed: ${error.message}`,
      });
    }
  }
}
