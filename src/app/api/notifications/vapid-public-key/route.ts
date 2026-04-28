import { NextResponse } from 'next/server';

/**
 * GET /api/notifications/vapid-public-key
 * 
 * Devuelve la clave pública VAPID para las suscripciones de push
 */
export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  
  if (!publicKey) {
    return NextResponse.json(
      { error: 'VAPID public key not configured' },
      { status: 500 }
    );
  }
  
  return NextResponse.json({ publicKey });
}
