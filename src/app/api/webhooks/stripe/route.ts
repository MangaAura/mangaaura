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

import { Prisma } from '@/generated/prisma/client';
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

  // Idempotency check: stripeEvent.create se hace DENTRO de $transaction
  // (más abajo). Si ya existe, lo detectamos por unique constraint.
  // Esto asegura atomicidad: si algo falla, no queda registro del evento
  // y Stripe retry naturalmente.

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { userId, auraAmount, type, planId } = session.metadata || {};

        // ── Handle subscription checkout (atómico) ────────────────────
        if (type === 'subscription' && userId && planId) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const subData = subscription as unknown as { current_period_end: number };

          await prisma.$transaction(async (tx) => {
            // Idempotency: si ya se procesó, salir sin hacer nada
            const existing = await tx.stripeEvent.findUnique({
              where: { stripeId: event.id },
            });
            if (existing) return;

            await tx.stripeEvent.create({
              data: { stripeId: event.id, type: event.type },
            });

            await tx.user.update({
              where: { id: userId },
              data: {
                subscriptionId: subscription.id,
                subscriptionStatus: subscription.status,
                subscriptionTier: planId,
                subscriptionEndsAt: new Date(subData.current_period_end * 1000),
                stripeCustomerId: session.customer as string,
              },
            });
          });

          break;
        }

        // ── Handle Aura purchase (atómico) ────────────────────────────
        if (!userId || !auraAmount) {
          console.error('[Stripe Webhook] Missing metadata');
          return Response.json({ error: 'Missing metadata' }, { status: 400 });
        }

        const auraAmountInt = parseInt(auraAmount);

        // Todo dentro de $transaction: stripeEvent + user update + transaction + referral
        const referralResult = await prisma.$transaction(async (tx) => {
          // 1. Idempotency key dentro de la transacción
          // Si ya existe (Stripe retry), el unique constraint lanza P2002 y hacemos rollback
          const existing = await tx.stripeEvent.findUnique({
            where: { stripeId: event.id },
          });
          if (existing) {
            return { alreadyProcessed: true as const };
          }

          await tx.stripeEvent.create({
            data: { stripeId: event.id, type: event.type },
          });

          // 2. Actualizar aura del usuario
          const user = await tx.user.findUnique({
            where: { id: userId },
            select: { auraFirstPurchaseAt: true },
          });
          const firstPurchaseAt = user?.auraFirstPurchaseAt ?? new Date();

          await tx.user.update({
            where: { id: userId },
            data: {
              auraBalance: { increment: auraAmountInt },
              auraLifetimePurchased: { increment: auraAmountInt },
              auraFirstPurchaseAt: { set: firstPurchaseAt },
            },
          });

          // 3. Crear registro de transacción
          await tx.transaction.create({
            data: {
              userId,
              amount: auraAmountInt,
              type: 'AURA_PURCHASE',
              referenceId: session.id,
              description: `Purchased ${auraAmount} Aura via Stripe`,
            },
          });

          // 4. Manejar referral bonus (dentro de la misma transacción)
          const refResult = await handleReferralOnPurchaseTx(tx, userId, auraAmountInt);

          return { alreadyProcessed: false as const, ...refResult };
        });

        if (referralResult.alreadyProcessed) {
          return Response.json({ received: true, status: 'already_processed' });
        }

        // 5. Notificación al referrer (fuera de la transacción, best-effort)
        if (referralResult.shouldNotify) {
          tryNotifyReferralBonus(referralResult);
        }

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
    console.error('[Stripe Webhook] Error processing event:', error);
    // NO se devuelve 200 si falló — Stripe reintentará.
    // Como stripeEvent.create está dentro de $transaction,
    // si la transacción falló no hay registro del evento,
    // así que el retry se procesará limpio.
    return Response.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}

interface ReferralResult {
  shouldNotify: boolean;
  referrerId: string;
  refereeId: string;
  bonusAwarded: number;
  refereeUsername: string;
  refereeDisplayName: string | null;
}

/**
 * Maneja el referral bonus dentro de una transacción Prisma.
 * Nota: la NOTIFICACIÓN se envía fuera de la transacción para no bloquearla.
 */
async function handleReferralOnPurchaseTx(
  tx: Prisma.TransactionClient,
  userId: string,
  auraAmount: number
): Promise<ReferralResult | { shouldNotify: false }> {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { referredBy: true, username: true, displayName: true },
  });

  if (!user?.referredBy) {
    return { shouldNotify: false };
  }

  const referrer = await tx.user.findFirst({
    where: { referralCode: user.referredBy },
    select: { id: true },
  });

  if (!referrer) {
    return { shouldNotify: false };
  }

  const bonusAwarded = Math.floor(auraAmount * 0.10);

  const existingClaim = await tx.referralClaim.findUnique({
    where: {
      referrerId_refereeId: {
        referrerId: referrer.id,
        refereeId: userId,
      },
    },
  });

  let wasLocked = false;

  if (existingClaim) {
    if (existingClaim.status === 'locked') {
      wasLocked = true;
      await tx.referralClaim.update({
        where: { id: existingClaim.id },
        data: {
          status: 'unlocked',
          unlockedAt: new Date(),
          purchaseAmount: auraAmount,
          bonusAwarded,
        },
      });
    }
  } else {
    wasLocked = true;
    await tx.referralClaim.create({
      data: {
        referrerId: referrer.id,
        refereeId: userId,
        purchaseAmount: auraAmount,
        bonusAwarded,
        status: 'unlocked',
        unlockedAt: new Date(),
      },
    });
  }

  return {
    shouldNotify: wasLocked && bonusAwarded > 0,
    referrerId: referrer.id,
    refereeId: userId,
    bonusAwarded,
    refereeUsername: user.username,
    refereeDisplayName: user.displayName,
  };
}

/** Envía notificación al referrer (best-effort, fuera de transacción) */
async function tryNotifyReferralBonus(result: ReferralResult) {
  try {
    const { getNotificationService } = await import('@/core/services/NotificationService');
    const ns = await getNotificationService();
    await ns.notifyReferralBonusUnlocked(result.referrerId, {
      id: result.refereeId,
      username: result.refereeUsername,
      displayName: result.refereeDisplayName,
    }, result.bonusAwarded);
  } catch (notifyError) {
    console.error('[Stripe Webhook] Error sending referral bonus notification:', notifyError);
  }
}

/**
 * GET /api/webhooks/stripe
 * For Stripe webhook verification
 */
export async function GET() {
  return Response.json({ status: 'Stripe webhook endpoint active' });
}
