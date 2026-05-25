/**
 * Stripe Configuration
 * 
 * Configuración de Stripe para pagos de Aura.
 */

import Stripe from 'stripe';

// Validate environment variables
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Lazy initialization of Stripe (only when needed)
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!STRIPE_SECRET_KEY) {
      console.warn('[Stripe] Missing STRIPE_SECRET_KEY environment variable');
      throw new Error('Stripe not configured');
    }
stripeInstance = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2026-04-22.dahlia',
  });

  }
  return stripeInstance;
}

// Backward compatible export
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});

// Subscription plans
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  priceId: string;
  amount: number;
  interval: 'month' | 'year';
  features: string[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'premium-monthly',
    name: 'Premium Mensual',
    description: 'Acceso a capítulos exclusivos, sin anuncios, y más',
    priceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || 'price_premium_monthly',
    amount: 499,
    interval: 'month',
    features: ['Capítulos exclusivos', 'Sin anuncios', 'Modo offline', 'Insignias premium'],
  },
  {
    id: 'premium-yearly',
    name: 'Premium Anual',
    description: 'Todo lo de Premium con 2 meses gratis',
    priceId: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || 'price_premium_yearly',
    amount: 4999,
    interval: 'year',
    features: ['Todo lo de Premium Mensual', '2 meses gratis', 'Soporte prioritario'],
  },
];

export function getSubscriptionPlanById(planId: string): SubscriptionPlan | null {
  return SUBSCRIPTION_PLANS.find(p => p.id === planId) || null;
}

// Aura packages/prices
export const AURA_PACKAGES = [
  {
    id: 'aura_100',
    amount: 100,
    priceUSD: 100, // $1.00
    name: '100 Aura',
    description: 'Paquete básico para propinas',
  },
  {
    id: 'aura_500',
    amount: 500,
    priceUSD: 450, // $4.50 (10% discount)
    name: '500 Aura',
    description: 'Paquete popular para lectores activos',
  },
  {
    id: 'aura_1000',
    amount: 1000,
    priceUSD: 850, // $8.50 (15% discount)
    name: '1000 Aura',
    description: 'Mejor valor para lectores frecuentes',
  },
  {
    id: 'aura_5000',
    amount: 5000,
    priceUSD: 4000, // $40.00 (20% discount)
    name: '5000 Aura',
    description: 'Paquete premium para patrocinadores',
  },
] as const;

// Helper to get package by ID
export function getPackageById(packageId: string) {
  return AURA_PACKAGES.find(p => p.id === packageId) || null;
}

// Convert USD cents to Stripe amount
export function toStripeAmount(usdCents: number): number {
  return usdCents; // Stripe uses cents
}

// Format amount for display
export function formatAmount(usdCents: number): string {
  return `$${(usdCents / 100).toFixed(2)}`;
}

// Verify webhook signature
export async function verifyStripeWebhook(
  payload: string,
  signature: string
): Promise<Stripe.Event | null> {
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('[Stripe] Missing webhook secret');
    return null;
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[Stripe] Webhook verification failed:', err);
    return null;
  }
}

export default stripe;
