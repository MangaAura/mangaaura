import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const memeSchema = z.object({
  panelId: z.string().min(1).max(200),
  mangaTitle: z.string().min(1).max(200),
  chapterNumber: z.number().int().positive().optional(),
  texts: z.array(z.string().max(500)).max(10).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = memeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { panelId, mangaTitle, chapterNumber } = parsed.data;

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        xpPoints: { increment: 5 },
      },
    });

    return NextResponse.json({
      success: true,
      meme: {
        id: panelId,
        userId: session.user.id,
        mangaTitle,
        chapterNumber,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error saving meme:', error);
    return NextResponse.json(
      { error: 'Error al guardar meme' },
      { status: 500 }
    );
  }
}

    const body = await request.json();
    const { panelId, mangaTitle, chapterNumber, texts } = body;

    // Agregar XP al usuario por crear meme (el meme real se guarda en el cliente)
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        xpPoints: {
          increment: 5,
        },
      },
    });

    return NextResponse.json({
      success: true,
      meme: {
        userId: session.user.id,
        mangaTitle,
        chapterNumber,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error saving meme:', error);
    return NextResponse.json(
      { error: 'Error al guardar meme' },
      { status: 500 }
    );
  }
}

// GET /api/memes - Obtener memes del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    // Por ahora devolvemos un array vacío (la funcionalidad de memes se implementará con MongoDB)
    return NextResponse.json({
      memes: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching memes:', error);
    return NextResponse.json(
      { error: 'Error al obtener memes' },
      { status: 500 }
    );
  }
}
