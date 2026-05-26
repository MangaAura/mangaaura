/**
 * Stripe Webhook
 *
 * Handle Stripe events:
 * - checkout.session.completed: Add Aura to user or activate subscription
 * - checkout.session.expired: Log failed attempt
 * - customer.subscription.created/updated/deleted: Manage subscription status
 * - invoice.payment_succeeded/failed: Handle billing
 */

import { NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';
import { stripe, verifyStripeWebhook, SUBSCRIPTION_PLANS } from '@/lib/stripe';

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

  // Idempotency check - skip if already processed
  try {
    const existingEvent = await prisma.stripeEvent.findUnique({
      where: { stripeId: event.id },
    });
    if (existingEvent) {
      return Response.json({ received: true, status: 'already_processed' });
    }
  } catch {
    // If the table doesn't exist yet, continue (migration not run)
  }

  // Record event before processing (idempotency key)
  let eventRecorded = false;
  try {
    await prisma.stripeEvent.create({
      data: {
        stripeId: event.id,
        type: event.type,
      },
    });
    eventRecorded = true;
  } catch (error) {
    // If create fails due to unique constraint, another instance processed it
    if ((error as { code?: string }).code === 'P2002') {
      return Response.json({ received: true, status: 'already_processed' });
    }
    // If table doesn't exist, continue without idempotency
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { userId, auraAmount, type, planId } = session.metadata || {};

        // Handle subscription checkout
        if (type === 'subscription' && userId && planId) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const subData = subscription as unknown as { current_period_end: number };
          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionId: subscription.id,
              subscriptionStatus: subscription.status,
              subscriptionTier: planId,
              subscriptionEndsAt: new Date(subData.current_period_end * 1000),
              stripeCustomerId: session.customer as string,
            },
          });
        break;
        }

        // Handle Aura purchase
        if (!userId || !auraAmount) {
          console.error('[Stripe Webhook] Missing metadata');
          return Response.json({ error: 'Missing metadata' }, { status: 400 });
        }

        const auraAmountInt = parseInt(auraAmount);

        await prisma.user.update({
          where: { id: userId },
          data: {
            auraBalance: {
              increment: auraAmountInt,
            },
            auraLifetimePurchased: {
              increment: auraAmountInt,
            },
            auraFirstPurchaseAt: {
              set: await getFirstPurchaseAt(userId),
            },
          },
        });

        await prisma.transaction.create({
          data: {
            userId,
            amount: auraAmountInt,
            type: 'AURA_PURCHASE',
            referenceId: session.id,
            description: `Purchased ${auraAmount} Aura via Stripe`,
          },
        });

        // Handle referral: if user was referred, create/update ReferralClaim
        await handleReferralOnPurchase(userId, auraAmountInt);

    break;
  }

  case 'checkout.session.expired': {
    break;
      }

  case 'payment_intent.payment_failed': {
    break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = (subscription as unknown as { customer: string }).customer;
        const status = (subscription as unknown as { status: string }).status;

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
          select: { id: true },
        });

        if (!user) {
          console.error(`[Stripe Webhook] No user found for customer ${customerId}`);
          break;
        }

        const sub = subscription as unknown as { id: string; current_period_end: number; items?: { data: Array<{ price: { id: string } }> } };
        const updateData: Record<string, unknown> = {
          subscriptionId: sub.id,
          subscriptionStatus: status,
          subscriptionEndsAt: new Date(sub.current_period_end * 1000),
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

    break;
  }

  case 'customer.subscription.deleted': {
        const subscription = event.data.object as unknown as { customer: string };
        const customerId = subscription.customer;

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

    break;
  }

  case 'invoice.payment_succeeded': {
        const invoice = event.data.object as unknown as { subscription: string };
        const subscriptionId = invoice.subscription;

        if (!subscriptionId) break;

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const custId = sub.customer as string;

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: custId },
          select: { id: true },
        });

        if (!user) break;

        const subData = sub as unknown as { current_period_end: number };
        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionStatus: sub.status,
            subscriptionEndsAt: new Date(subData.current_period_end * 1000),
          },
        });
        break;
      }

      case 'invoice.payment_failed': {
        const failedInvoice = event.data.object as unknown as { subscription: string };
        const failedSubId = failedInvoice.subscription;

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

    break;
  }

  default:
    }

    return Response.json({ received: true });
  } catch (error) {
    // If we recorded the event but processing failed, we still return success
    // to prevent Stripe from retrying. The event is already idempotent.
    if (eventRecorded) {
      console.error('[Stripe Webhook] Error processing event:', error);
      return Response.json({ received: true, status: 'processed_with_error' });
    }
    return Response.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}

async function getFirstPurchaseAt(userId: string): Promise<Date | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { auraFirstPurchaseAt: true },
  });
  return user?.auraFirstPurchaseAt ?? new Date();
}

async function handleReferralOnPurchase(userId: string, auraAmount: number) {
  // Find the user and check if they were referred
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referredBy: true },
  });

  if (!user?.referredBy) return;

  // Find the referrer by their referralCode
  const referrer = await prisma.user.findFirst({
    where: { referralCode: user.referredBy },
    select: { id: true },
  });

  if (!referrer) return;

  // Find existing ReferralClaim for this referral pair
  const existingClaim = await prisma.referralClaim.findUnique({
    where: {
      referrerId_refereeId: {
        referrerId: referrer.id,
        refereeId: userId,
      },
    },
  });

  if (existingClaim) {
    // Update existing claim if it was locked
    if (existingClaim.status === 'locked') {
      await prisma.referralClaim.update({
        where: { id: existingClaim.id },
        data: {
          status: 'unlocked',
          unlockedAt: new Date(),
          purchaseAmount: auraAmount,
          bonusAwarded: Math.floor(auraAmount * 0.10),
        },
      });
    }
  } else {
    // Create new claim
    await prisma.referralClaim.create({
      data: {
        referrerId: referrer.id,
        refereeId: userId,
        purchaseAmount: auraAmount,
        bonusAwarded: Math.floor(auraAmount * 0.10),
        status: 'unlocked',
        unlockedAt: new Date(),
      },
    });
  }
}

/**
 * GET /api/webhooks/stripe
 * For Stripe webhook verification
 */
export async function GET() {
  return Response.json({ status: 'Stripe webhook endpoint active' });
}
