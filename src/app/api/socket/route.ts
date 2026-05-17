/**
 * Socket.IO API Route
 * 
 * Inicializa el servidor Socket.IO para Next.js App Router.
 */

import { NextResponse } from 'next/server';
import { getIO } from '@/lib/socket';

export async function GET() {
  try {
    // Verificar que Socket.IO esté inicializado
    const io = getIO();
    
    if (!io) {
      return NextResponse.json(
        { error: 'Socket.IO not initialized' },
        { status: 503 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      status: 'Socket.IO server running',
      connections: io.sockets.sockets.size 
    });
  } catch (error) {
    console.error('[Socket API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Este archivo actúa como entry point para inicializar Socket.IO
// El servidor real se inicializa en server.ts o mediante custom server
export async function POST() {
  return NextResponse.json({ 
    message: 'Socket.IO server runs independently' 
  });
}
