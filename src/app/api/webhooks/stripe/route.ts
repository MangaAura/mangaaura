/**
 * Stripe Webhook
 * 
 * Handle Stripe events:
 * - checkout.session.completed: Add InkCoins to user
 * - checkout.session.expired: Log failed attempt
 */

import { NextRequest } from 'next/server';
import { stripe, verifyStripeWebhook } from '@/lib/stripe';
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
        const { userId, inkcoinsAmount } = session.metadata || {};

        if (!userId || !inkcoinsAmount) {
          console.error('[Stripe Webhook] Missing metadata');
          return Response.json({ error: 'Missing metadata' }, { status: 400 });
        }

        // Add InkCoins to user
        await prisma.user.update({
          where: { id: userId },
          data: {
            inkcoinsBalance: {
              increment: parseInt(inkcoinsAmount),
            },
          },
        });

        // Create transaction record
        await prisma.transaction.create({
          data: {
            userId,
            amount: parseInt(inkcoinsAmount),
            type: 'INKCOIN_PURCHASE',
            referenceId: session.id,
            description: `Purchased ${inkcoinsAmount} InkCoins via Stripe`,
          },
        });

        console.log(`[Stripe Webhook] Added ${inkcoinsAmount} InkCoins to user ${userId}`);
        break;
      }

      case 'checkout.session.expired': {
        console.log('[Stripe Webhook] Checkout session expired');
        break;
      }

      case 'payment_intent.payment_failed': {
        console.log('[Stripe Webhook] Payment failed');
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Error processing event:', error);
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
