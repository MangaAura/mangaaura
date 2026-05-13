import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const QUESTION_TEMPLATES = [
  {
    text: '¿Cuál es el nombre del protagonista en este capítulo?',
    generateAnswers: (name: string) => shuffleArray([
      name,
      `${name} Shiro`,
      `${name} Kuro`,
      `Maestro ${name}`,
    ]),
  },
  {
    text: '¿Dónde ocurre la escena principal de este capítulo?',
    generateAnswers: (location: string) => shuffleArray([
      location,
      'En el cielo',
      'En las montañas',
      'En un castillo abandonado',
    ]),
  },
  {
    text: '¿Qué técnica utilizó el protagonista en este capítulo?',
    generateAnswers: (_: string) => shuffleArray([
      'Corte del Dragón Oscuro',
      'Estallido de Sombras',
      'Relámpago Carmesí',
      'Escudo de Maná Absoluto',
    ]),
  },
  {
    text: '¿Contra quién luchó el protagonista en este capítulo?',
    generateAnswers: (_: string) => shuffleArray([
      'Un antiguo maestro',
      'El Rey Demonio',
      'Un rival misterioso',
      'Las fuerzas de la naturaleza',
    ]),
  },
  {
    text: '¿Cuál fue el resultado de la batalla de este capítulo?',
    generateAnswers: (_: string) => shuffleArray([
      'Victoria aplastante del protagonista',
      'El protagonista tuvo que retirarse',
      'Empate con un cliffhanger',
      'El enemigo escapó en el último momento',
    ]),
  },
];

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function simpleHash(str: string, seed: number): number {
  let hash = seed;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapterId');

    if (!chapterId) {
      return NextResponse.json({ error: 'chapterId requerido' }, { status: 400 });
    }

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { id: true, chapterNumber: true, title: true, mangaId: true },
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Capítulo no encontrado' }, { status: 404 });
    }

    const manga = await prisma.mangaSeries.findUnique({
      where: { id: chapter.mangaId },
      select: { title: true },
    });

    const hash = simpleHash(`${chapter.id}_${session.user.id}_${chapter.chapterNumber}`, 42);
    const template = QUESTION_TEMPLATES[hash % QUESTION_TEMPLATES.length];
    const answers = template.generateAnswers(manga?.title ?? chapter.title ?? 'El protagonista');
    const correctAnswerIndex = hash % 4;

    return NextResponse.json({
      question: template.text,
      answers,
      correctAnswer: correctAnswerIndex,
      chapterTitle: chapter.title || `Capítulo ${chapter.chapterNumber}`,
      chapterId: chapter.id,
    });
  } catch (error) {
    console.error('Error generando quiz:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}