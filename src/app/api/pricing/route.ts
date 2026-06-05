/**
 * Pricing API
 *
 * GET: Retrieve current pricing from Stripe API.
 * Falls back to hardcoded values if Stripe is unavailable.
 *
 * Caching: 1 hour (revalidate: 3600) since pricing changes infrequently.
 */

import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

import { AURA_PACKAGES, SUBSCRIPTION_PLANS, getStripe } from '@/lib/stripe';

export interface AuraPack {
  id: string;
  name: string;
  amount: number;
  priceUSD: number;
  description: string;
}

export interface SubscriptionPlanData {
  id: string;
  name: string;
  description: string;
  priceId: string;
  amount: number;
  displayPrice: string;
  interval: 'month' | 'year';
  features: string[];
}

export interface PricingResponse {
  aura: AuraPack[];
  subscriptions: SubscriptionPlanData[];
  source: 'stripe' | 'fallback';
  fetchedAt: string;
}

export async function GET() {
  const aura: AuraPack[] = AURA_PACKAGES.map((p) => ({
    id: p.id,
    name: p.name,
    amount: p.amount,
    priceUSD: p.priceUSD,
    description: p.description,
  }));

  const subscriptions: SubscriptionPlanData[] = [];
  let source: 'stripe' | 'fallback' = 'fallback';

  try {
    const stripe = getStripe();

    // Try to fetch subscription prices from Stripe in real-time
    const results = await Promise.allSettled(
      SUBSCRIPTION_PLANS.map((plan) =>
        stripe.prices.retrieve(plan.priceId, {
          expand: ['product'],
        })
      )
    );

    let allSucceeded = true;

    for (let i = 0; i < SUBSCRIPTION_PLANS.length; i++) {
      const result = results[i];
      const plan = SUBSCRIPTION_PLANS[i];

      if (result.status === 'fulfilled') {
        const price = result.value;
        const product = price.product as Stripe.Product | null;

        subscriptions.push({
          id: plan.id,
          name: product?.name || plan.name,
          description: product?.description || plan.description,
          priceId: price.id,
          amount: price.unit_amount ?? plan.amount,
          displayPrice: formatDisplayPrice(price.unit_amount ?? plan.amount, price.currency || 'usd'),
          interval: (price.recurring?.interval === 'month' || price.recurring?.interval === 'year' ? price.recurring.interval : plan.interval) as 'month' | 'year',
          features: plan.features,
        });
      } else {
        allSucceeded = false;
        // Fallback individual plan
        subscriptions.push({
          id: plan.id,
          name: plan.name,
          description: plan.description,
          priceId: plan.priceId,
          amount: plan.amount,
          displayPrice: formatDisplayPrice(plan.amount, 'usd'),
          interval: plan.interval,
          features: plan.features,
        });
      }
    }

    if (allSucceeded) {
      source = 'stripe';
    }
  } catch {
    // Stripe unavailable — use hardcoded fallback
    for (const plan of SUBSCRIPTION_PLANS) {
      subscriptions.push({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        priceId: plan.priceId,
        amount: plan.amount,
        displayPrice: formatDisplayPrice(plan.amount, 'usd'),
        interval: plan.interval,
        features: plan.features,
      });
    }
  }

  const response: PricingResponse = {
    aura,
    subscriptions,
    source,
    fetchedAt: new Date().toISOString(),
  };

  return NextResponse.json(response);
}

function formatDisplayPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(amount / 100);
  } catch {
    return `$${(amount / 100).toFixed(2)}`;
  }
}
