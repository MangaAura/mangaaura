/**
 * Checkout API
 * 
 * POST: Create Stripe checkout session for InkCoins purchase
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { getStripe, INKCOIN_PACKAGES, getPackageById } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const checkoutSchema = z.object({
  packageId: z.string(),
});

/**
 * POST /api/checkout
 * Create checkout session for InkCoins purchase
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { packageId } = checkoutSchema.parse(body);

    // Get package
    const package_ = getPackageById(packageId);
    if (!package_) {
      return Response.json({ error: 'Invalid package' }, { status: 400 });
    }

    // Get or create Stripe customer
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, stripeCustomerId: true },
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    let customerId = user.stripeCustomerId;

  if (!customerId) {
    // Create new Stripe customer
    const stripe = getStripe();
    const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID to user
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

  // Create checkout session
  const stripe = getStripe();
  const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: package_.name,
              description: package_.description,
            },
            unit_amount: package_.priceUSD,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/checkout/cancel`,
      metadata: {
        userId: user.id,
        packageId: package_.id,
        inkcoinsAmount: package_.amount.toString(),
      },
    });

    return Response.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error('[Checkout] Error creating session:', error);
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }
    return Response.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
