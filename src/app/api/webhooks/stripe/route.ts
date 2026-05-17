/**
 * Stripe Webhook
 * 
 * Handle Stripe events:
 * - checkout.session.completed: Add InkCoins to user or activate subscription
 * - checkout.session.expired: Log failed attempt
 * - customer.subscription.created/updated/deleted: Manage subscription status
 * - invoice.payment_succeeded/failed: Handle billing
 */

import { NextRequest } from 'next/server';
import { stripe, verifyStripeWebhook, SUBSCRIPTION_PLANS } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature') || '';

  // Verify webhook
  const event = await verifyStripeWebhook(payload, signature);
  if (!event) {
    return Response.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { userId, inkcoinsAmount, type, planId } = session.metadata || {};

        // Handle subscription checkout
        if (type === 'subscription' && userId && planId) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionId: subscription.id,
              subscriptionStatus: subscription.status,
              subscriptionTier: planId,
              subscriptionEndsAt: new Date((subscription as any).current_period_end * 1000),
              stripeCustomerId: session.customer as string,
            },
          });
          // console.log(`[Stripe Webhook] Subscription activated for user ${userId}: ${planId}`);
          break;
        }

        // Handle InkCoins purchase (existing)
        if (!userId || !inkcoinsAmount) {
          console.error('[Stripe Webhook] Missing metadata');
          return Response.json({ error: 'Missing metadata' }, { status: 400 });
        }

        await prisma.user.update({
          where: { id: userId },
          data: {
            inkcoinsBalance: {
              increment: parseInt(inkcoinsAmount),
            },
          },
        });

        await prisma.transaction.create({
          data: {
            userId,
            amount: parseInt(inkcoinsAmount),
            type: 'INKCOIN_PURCHASE',
            referenceId: session.id,
            description: `Purchased ${inkcoinsAmount} InkCoins via Stripe`,
          },
        });

        // console.log(`[Stripe Webhook] Added ${inkcoinsAmount} InkCoins to user ${userId}`);
        break;
      }

      case 'checkout.session.expired': {
        // console.log('[Stripe Webhook] Checkout session expired');
        break;
      }

      case 'payment_intent.payment_failed': {
        // console.log('[Stripe Webhook] Payment failed');
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;
        const status = subscription.status as string;

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
          select: { id: true },
        });

        if (!user) {
          console.error(`[Stripe Webhook] No user found for customer ${customerId}`);
          break;
        }

        const updateData: any = {
          subscriptionId: subscription.id,
          subscriptionStatus: status,
          subscriptionEndsAt: new Date((subscription as any).current_period_end * 1000),
        };

        // Only update tier on creation or if it hasn't been set
        if (event.type === 'customer.subscription.created') {
          const items = subscription.items?.data || [];
          const priceId = items[0]?.price?.id;
          const plan = SUBSCRIPTION_PLANS.find(p => p.priceId === priceId);
          if (plan) {
            updateData.subscriptionTier = plan.id;
          }
        }

        await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });

        // console.log(`[Stripe Webhook] Subscription ${status} for user ${user.id}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
          select: { id: true },
        });

        if (!user) {
          console.error(`[Stripe Webhook] No user found for customer ${customerId}`);
          break;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionStatus: 'canceled',
            subscriptionId: null,
            subscriptionTier: null,
            subscriptionEndsAt: null,
          },
        });

        // console.log(`[Stripe Webhook] Subscription canceled for user ${user.id}`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const custId = sub.customer as string;

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: custId },
          select: { id: true },
        });

        if (!user) break;

        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionStatus: sub.status,
            subscriptionEndsAt: new Date((sub as any).current_period_end * 1000),
          },
        });

        // console.log(`[Stripe Webhook] Invoice paid for user ${user.id}, renewed until ${new Date((sub as any).current_period_end * 1000).toISOString()}`);
        break;
      }

      case 'invoice.payment_failed': {
        const failedInvoice = event.data.object as any;
        const failedSubId = failedInvoice.subscription as string;

        if (!failedSubId) break;

        const failedSub = await stripe.subscriptions.retrieve(failedSubId);
        const failedCustId = failedSub.customer as string;

        const failedUser = await prisma.user.findFirst({
          where: { stripeCustomerId: failedCustId },
          select: { id: true },
        });

        if (!failedUser) break;

        await prisma.user.update({
          where: { id: failedUser.id },
          data: { subscriptionStatus: 'past_due' },
        });

        // console.log(`[Stripe Webhook] Invoice payment failed for user ${failedUser.id}`);
        break;
      }

      default:
        // console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return Response.json({ received: true });
  } catch (error) {
    // console.error('[Stripe Webhook] Error processing event:', error);
    return Response.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}

/**
 * GET /api/webhooks/stripe
 * For Stripe webhook verification
 */
export async function GET() {
  return Response.json({ status: 'Stripe webhook endpoint active' });
}
