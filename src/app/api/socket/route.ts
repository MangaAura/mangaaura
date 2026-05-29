/**
 * Socket.IO API Route
 *
 * WebSockets fueron removidos. Este endpoint retorna estado deshabilitado.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    status: 'disabled',
    message: 'WebSockets are disabled. The app runs in HTTP-only mode on Vercel.',
  });
}

export async function POST() {
  return NextResponse.json({
    message: 'WebSockets are disabled. Use HTTP endpoints instead.',
  });
}
