/**
 * Stripe Configuration
 * 
 * Configuración de Stripe para pagos de InkCoins.
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
      apiVersion: '2024-06-20',
      typescript: true,
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

// InkCoins packages/prices
export const INKCOIN_PACKAGES = [
  {
    id: 'inkcoins_100',
    amount: 100,
    priceUSD: 100, // $1.00
    name: '100 InkCoins',
    description: 'Paquete básico para propinas',
  },
  {
    id: 'inkcoins_500',
    amount: 500,
    priceUSD: 450, // $4.50 (10% discount)
    name: '500 InkCoins',
    description: 'Paquete popular para lectores activos',
  },
  {
    id: 'inkcoins_1000',
    amount: 1000,
    priceUSD: 850, // $8.50 (15% discount)
    name: '1000 InkCoins',
    description: 'Mejor valor para lectores frecuentes',
  },
  {
    id: 'inkcoins_5000',
    amount: 5000,
    priceUSD: 4000, // $40.00 (20% discount)
    name: '5000 InkCoins',
    description: 'Paquete premium para patrocinadores',
  },
] as const;

// Helper to get package by ID
export function getPackageById(packageId: string) {
  return INKCOIN_PACKAGES.find(p => p.id === packageId) || null;
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
