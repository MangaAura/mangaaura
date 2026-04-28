import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getStripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'Falta session_id' }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json({ paid: false, status: checkoutSession.payment_status });
    }

    const inkcoinsAmount = parseInt(checkoutSession.metadata?.inkcoinsAmount || '0');

    return NextResponse.json({
      paid: true,
      inkcoinsAdded: inkcoinsAmount,
      packageName: checkoutSession.metadata?.packageId || 'InkCoins',
    });
  } catch (error) {
    console.error('Error verifying checkout session:', error);
    return NextResponse.json({ error: 'Error al verificar la sesión' }, { status: 500 });
  }
}
