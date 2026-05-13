import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe';
import { getPremiumStatus } from '@/lib/premium';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  const status = await getPremiumStatus(session.user.id);

  return Response.json({
    ...status,
    plans: SUBSCRIPTION_PLANS,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Redirect to checkout with planId
  const body = await request.json();
  const { planId } = body;

  if (!planId) {
    return Response.json({ error: 'Se requiere planId' }, { status: 400 });
  }

  const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
  if (!plan) {
    return Response.json({ error: 'Plan no válido' }, { status: 400 });
  }

  // Create a redirect URL to the checkout API with the plan
  return Response.json({
    redirectTo: `/api/checkout`,
    planId: plan.id,
  });
}
