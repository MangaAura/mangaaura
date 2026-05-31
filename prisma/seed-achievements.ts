/**
 * Seed de logros (achievements) para MangaAura
 * Define los logros iniciales con sus condiciones y recompensas
 * @packageDocumentation
 */

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';
import type { AchievementCondition } from '@/core/services/IAchievementRepository';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

export type { AchievementCondition };

/**
 * Definición de un logro
 */
interface AchievementDefinition {
  badgeId: string;
  name: string;
  description: string;
  xpReward: number;
  iconUrl: string;
  condition: AchievementCondition;
  category: 'READING' | 'SOCIAL' | 'CREATION' | 'MILESTONE';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'LEGENDARY';
}

/**
 * Logros iniciales de MangaAura
 */
export const achievements: AchievementDefinition[] = [
  // Logros de lectura
  {
    badgeId: 'PRIMEROS_PASOS',
    name: 'Primeros Pasos',
    description: 'Lee tu primer capítulo en MangaAura',
    xpReward: 100,
    iconUrl: '/badges/primeros-pasos.svg',
    condition: { type: 'CHAPTERS_READ', count: 1 },
    category: 'READING',
    difficulty: 'EASY',
  },
  {
    badgeId: 'LECTOR_ASIDUO',
    name: 'Lector Asiduo',
    description: 'Lee 10 capítulos',
    xpReward: 500,
    iconUrl: '/badges/lector-asiduo.svg',
    condition: { type: 'CHAPTERS_READ', count: 10 },
    category: 'READING',
    difficulty: 'MEDIUM',
  },
  {
    badgeId: 'MANGA_LOVER',
    name: 'Manga Lover',
    description: 'Completa 5 mangas diferentes',
    xpReward: 1000,
    iconUrl: '/badges/manga-lover.svg',
    condition: { type: 'MANGAS_COMPLETED', count: 5 },
    category: 'READING',
    difficulty: 'HARD',
  },

  // Logros sociales
  {
    badgeId: 'COMENTARISTA',
    name: 'Comentarista',
    description: 'Publica tu primer comentario',
    xpReward: 50,
    iconUrl: '/badges/comentarista.svg',
    condition: { type: 'COMMENTS_POSTED', count: 1 },
    category: 'SOCIAL',
    difficulty: 'EASY',
  },
  {
    badgeId: 'INFLUENCER',
    name: 'Influencer',
    description: 'Recibe 50 likes en tus comentarios',
    xpReward: 300,
    iconUrl: '/badges/influencer.svg',
    condition: { type: 'COMMENT_LIKES_RECEIVED', count: 50 },
    category: 'SOCIAL',
    difficulty: 'MEDIUM',
  },

  // Logros de contribución
  {
    badgeId: 'CORRECTOR',
    name: 'Corrector',
    description: 'Tu corrección de capítulo fue aprobada',
    xpReward: 200,
    iconUrl: '/badges/corrector.svg',
    condition: { type: 'CORRECTIONS_APPROVED', count: 1 },
    category: 'CREATION',
    difficulty: 'MEDIUM',
  },

  // Logros de creación
  {
    badgeId: 'CREADOR NATO',
    name: 'Creador Naton',
    description: 'Crea tu primer manga',
    xpReward: 500,
    iconUrl: '/badges/creador-nato.svg',
    condition: { type: 'MANGAS_CREATED', count: 1 },
    category: 'CREATION',
    difficulty: 'HARD',
  },

  // Logros de patrocinio
  {
    badgeId: 'PATROCINADOR',
    name: 'Patrocinador',
    description: 'Gana una puja de patrocinio',
    xpReward: 200,
    iconUrl: '/badges/patrocinador.svg',
    condition: { type: 'SPONSORSHIPS_WON', count: 1 },
    category: 'CREATION',
    difficulty: 'MEDIUM',
  },

  // Logros de nivel (milestones)
  {
    badgeId: 'MAESTRO_MANGA',
    name: 'Maestro Manga',
    description: 'Alcanza el nivel 10',
    xpReward: 2000,
    iconUrl: '/badges/maestro-manga.svg',
    condition: { type: 'LEVEL_REACHED', level: 10 },
    category: 'MILESTONE',
    difficulty: 'HARD',
  },
  {
    badgeId: 'LEYENDA',
    name: 'Leyenda',
    description: 'Alcanza el nivel 20',
    xpReward: 5000,
    iconUrl: '/badges/leyenda.svg',
    condition: { type: 'LEVEL_REACHED', level: 20 },
    category: 'MILESTONE',
    difficulty: 'LEGENDARY',
  },

  // Logros de misiones
  {
    badgeId: 'MISIONERO_PRINCIPIANTE',
    name: 'Misionero Principiante',
    description: 'Completa 5 misiones',
    xpReward: 100,
    iconUrl: '/badges/misionero-principiante.svg',
    condition: { type: 'QUESTS_COMPLETED', count: 5 },
    category: 'READING',
    difficulty: 'EASY',
  },
  {
    badgeId: 'MISIONERO_DEDICADO',
    name: 'Misionero Dedicado',
    description: 'Completa 25 misiones',
    xpReward: 300,
    iconUrl: '/badges/misionero-dedicado.svg',
    condition: { type: 'QUESTS_COMPLETED', count: 25 },
    category: 'READING',
    difficulty: 'MEDIUM',
  },
  {
    badgeId: 'MISIONERO_MAESTRO',
    name: 'Misionero Maestro',
    description: 'Completa 100 misiones',
    xpReward: 1000,
    iconUrl: '/badges/misionero-maestro.svg',
    condition: { type: 'QUESTS_COMPLETED', count: 100 },
    category: 'READING',
    difficulty: 'HARD',
  },
  {
    badgeId: 'MISIONERO_LEYENDA',
    name: 'Misionero Leyenda',
    description: 'Completa 500 misiones',
    xpReward: 3000,
    iconUrl: '/badges/misionero-leyenda.svg',
    condition: { type: 'QUESTS_COMPLETED', count: 500 },
    category: 'READING',
    difficulty: 'LEGENDARY',
  },

  // Logros de racha (streak)
  {
    badgeId: 'RACHA_3',
    name: 'Racha de 3 Días',
    description: 'Lee manga durante 3 días seguidos',
    xpReward: 20,
    iconUrl: '/badges/racha-3.svg',
    condition: { type: 'STREAK_REACHED', days: 3 },
    category: 'READING',
    difficulty: 'EASY',
  },
  {
    badgeId: 'RACHA_7',
    name: 'Racha de Fuego',
    description: 'Lee manga durante 7 días seguidos',
    xpReward: 50,
    iconUrl: '/badges/racha-7.svg',
    condition: { type: 'STREAK_REACHED', days: 7 },
    category: 'READING',
    difficulty: 'EASY',
  },
  {
    badgeId: 'RACHA_14',
    name: 'Dos Semanas Seguidas',
    description: 'Lee manga durante 14 días seguidos',
    xpReward: 100,
    iconUrl: '/badges/racha-14.svg',
    condition: { type: 'STREAK_REACHED', days: 14 },
    category: 'READING',
    difficulty: 'MEDIUM',
  },
  {
    badgeId: 'RACHA_30',
    name: 'Lector Dedicado',
    description: 'Mantén una racha de lectura por 30 días',
    xpReward: 200,
    iconUrl: '/badges/racha-30.svg',
    condition: { type: 'STREAK_REACHED', days: 30 },
    category: 'READING',
    difficulty: 'MEDIUM',
  },
  {
    badgeId: 'RACHA_60',
    name: 'Compromiso de Hierro',
    description: 'Mantén una racha de lectura por 60 días',
    xpReward: 300,
    iconUrl: '/badges/racha-60.svg',
    condition: { type: 'STREAK_REACHED', days: 60 },
    category: 'READING',
    difficulty: 'HARD',
  },
  {
    badgeId: 'RACHA_100',
    name: 'Centenario',
    description: 'Mantén una racha de lectura por 100 días',
    xpReward: 500,
    iconUrl: '/badges/racha-100.svg',
    condition: { type: 'STREAK_REACHED', days: 100 },
    category: 'READING',
    difficulty: 'HARD',
  },
  {
    badgeId: 'RACHA_180',
    name: 'Medio Año de Manga',
    description: 'Mantén una racha de lectura por 180 días',
    xpReward: 750,
    iconUrl: '/badges/racha-180.svg',
    condition: { type: 'STREAK_REACHED', days: 180 },
    category: 'READING',
    difficulty: 'HARD',
  },
  {
    badgeId: 'RACHA_365',
    name: 'Año Manga',
    description: 'Mantén una racha de lectura por 365 días',
    xpReward: 2000,
    iconUrl: '/badges/racha-365.svg',
    condition: { type: 'STREAK_REACHED', days: 365 },
    category: 'READING',
    difficulty: 'LEGENDARY',
  },

  // Logros por género (GENRE_CHAPTERS_READ)
  {
    badgeId: 'ACCION_INICIADO',
    name: 'Iniciado en Acción',
    description: 'Lee 10 capítulos de manga de Acción',
    xpReward: 100,
    iconUrl: '/badges/accion-iniciado.svg',
    condition: { type: 'GENRE_CHAPTERS_READ', genre: 'ACCION', count: 10 },
    category: 'READING',
    difficulty: 'EASY',
  },
  {
    badgeId: 'ACCION_VETERANO',
    name: 'Veterano de Acción',
    description: 'Lee 100 capítulos de manga de Acción',
    xpReward: 500,
    iconUrl: '/badges/accion-veterano.svg',
    condition: { type: 'GENRE_CHAPTERS_READ', genre: 'ACCION', count: 100 },
    category: 'READING',
    difficulty: 'MEDIUM',
  },
  {
    badgeId: 'ACCION_MAESTRO',
    name: 'Maestro de la Acción',
    description: 'Lee 500 capítulos de manga de Acción',
    xpReward: 1500,
    iconUrl: '/badges/accion-maestro.svg',
    condition: { type: 'GENRE_CHAPTERS_READ', genre: 'ACCION', count: 500 },
    category: 'READING',
    difficulty: 'HARD',
  },
  {
    badgeId: 'ROMANCE_INICIADO',
    name: 'Corazón Romántico',
    description: 'Lee 10 capítulos de manga Romántico',
    xpReward: 100,
    iconUrl: '/badges/romance-iniciado.svg',
    condition: { type: 'GENRE_CHAPTERS_READ', genre: 'ROMANCE', count: 10 },
    category: 'READING',
    difficulty: 'EASY',
  },
  {
    badgeId: 'ROMANCE_VETERANO',
    name: 'Romántico Empedernido',
    description: 'Lee 100 capítulos de manga Romántico',
    xpReward: 500,
    iconUrl: '/badges/romance-veterano.svg',
    condition: { type: 'GENRE_CHAPTERS_READ', genre: 'ROMANCE', count: 100 },
    category: 'READING',
    difficulty: 'MEDIUM',
  },
  {
    badgeId: 'ROMANCE_MAESTRO',
    name: 'Maestro del Romance',
    description: 'Lee 500 capítulos de manga Romántico',
    xpReward: 1500,
    iconUrl: '/badges/romance-maestro.svg',
    condition: { type: 'GENRE_CHAPTERS_READ', genre: 'ROMANCE', count: 500 },
    category: 'READING',
    difficulty: 'HARD',
  },
  {
    badgeId: 'FANTASIA_INICIADO',
    name: 'Soñador de Fantasía',
    description: 'Lee 10 capítulos de manga de Fantasía',
    xpReward: 100,
    iconUrl: '/badges/fantasia-iniciado.svg',
    condition: { type: 'GENRE_CHAPTERS_READ', genre: 'FANTASIA', count: 10 },
    category: 'READING',
    difficulty: 'EASY',
  },
  {
    badgeId: 'FANTASIA_VETERANO',
    name: 'Veterano de Fantasía',
    description: 'Lee 100 capítulos de manga de Fantasía',
    xpReward: 500,
    iconUrl: '/badges/fantasia-veterano.svg',
    condition: { type: 'GENRE_CHAPTERS_READ', genre: 'FANTASIA', count: 100 },
    category: 'READING',
    difficulty: 'MEDIUM',
  },
  {
    badgeId: 'FANTASIA_MAESTRO',
    name: 'Maestro de la Fantasía',
    description: 'Lee 500 capítulos de manga de Fantasía',
    xpReward: 1500,
    iconUrl: '/badges/fantasia-maestro.svg',
    condition: { type: 'GENRE_CHAPTERS_READ', genre: 'FANTASIA', count: 500 },
    category: 'READING',
    difficulty: 'HARD',
  },
  {
    badgeId: 'HORROR_INICIADO',
    name: 'Valiente del Horror',
    description: 'Lee 10 capítulos de manga de Horror',
    xpReward: 100,
    iconUrl: '/badges/horror-iniciado.svg',
    condition: { type: 'GENRE_CHAPTERS_READ', genre: 'HORROR', count: 10 },
    category: 'READING',
    difficulty: 'EASY',
  },
  {
    badgeId: 'HORROR_VETERANO',
    name: 'Veterano del Horror',
    description: 'Lee 100 capítulos de manga de Horror',
    xpReward: 500,
    iconUrl: '/badges/horror-veterano.svg',
    condition: { type: 'GENRE_CHAPTERS_READ', genre: 'HORROR', count: 100 },
    category: 'READING',
    difficulty: 'MEDIUM',
  },
  {
    badgeId: 'HORROR_MAESTRO',
    name: 'Maestro del Terror',
    description: 'Lee 500 capítulos de manga de Horror',
    xpReward: 1500,
    iconUrl: '/badges/horror-maestro.svg',
    condition: { type: 'GENRE_CHAPTERS_READ', genre: 'HORROR', count: 500 },
    category: 'READING',
    difficulty: 'HARD',
  },
  {
    badgeId: 'POLICIAL_INICIADO',
    name: 'Detective Novato',
    description: 'Lee 10 capítulos de manga Policial',
    xpReward: 100,
    iconUrl: '/badges/policial-iniciado.svg',
    condition: { type: 'GENRE_CHAPTERS_READ', genre: 'POLICIAL', count: 10 },
    category: 'READING',
    difficulty: 'EASY',
  },
  {
    badgeId: 'POLICIAL_VETERANO',
    name: 'Detective Experimentado',
    description: 'Lee 100 capítulos de manga Policial',
    xpReward: 500,
    iconUrl: '/badges/policial-veterano.svg',
    condition: { type: 'GENRE_CHAPTERS_READ', genre: 'POLICIAL', count: 100 },
    category: 'READING',
    difficulty: 'MEDIUM',
  },
  {
    badgeId: 'POLICIAL_MAESTRO',
    name: 'Maestro del Misterio',
    description: 'Lee 500 capítulos de manga Policial',
    xpReward: 1500,
    iconUrl: '/badges/policial-maestro.svg',
    condition: { type: 'GENRE_CHAPTERS_READ', genre: 'POLICIAL', count: 500 },
    category: 'READING',
    difficulty: 'HARD',
  },
  {
    badgeId: 'COMEDIA_INICIADO',
    name: 'Aprendiz de Comedia',
    description: 'Lee 10 capítulos de manga de Comedia',
    xpReward: 100,
    iconUrl: '/badges/comedia-iniciado.svg',
    condition: { type: 'GENRE_CHAPTERS_READ', genre: 'COMEDIA', count: 10 },
    category: 'READING',
    difficulty: 'EASY',
  },
  {
    badgeId: 'COMEDIA_VETERANO',
    name: 'Cómico Veterano',
    description: 'Lee 100 capítulos de manga de Comedia',
    xpReward: 500,
    iconUrl: '/badges/comedia-veterano.svg',
    condition: { type: 'GENRE_CHAPTERS_READ', genre: 'COMEDIA', count: 100 },
    category: 'READING',
    difficulty: 'MEDIUM',
  },
  {
    badgeId: 'COMEDIA_MAESTRO',
    name: 'Maestro de la Risa',
    description: 'Lee 500 capítulos de manga de Comedia',
    xpReward: 1500,
    iconUrl: '/badges/comedia-maestro.svg',
    condition: { type: 'GENRE_CHAPTERS_READ', genre: 'COMEDIA', count: 500 },
    category: 'READING',
    difficulty: 'HARD',
  },
  {
    badgeId: 'DRAMA_INICIADO',
    name: 'Dramático Iniciado',
    description: 'Lee 10 capítulos de manga de Drama',
    xpReward: 100,
    iconUrl: '/badges/drama-iniciado.svg',
    condition: { type: 'GENRE_CHAPTERS_READ', genre: 'DRAMA', count: 10 },
    category: 'READING',
    difficulty: 'EASY',
  },
  {
    badgeId: 'DRAMA_VETERANO',
    name: 'Veterano del Drama',
    description: 'Lee 100 capítulos de manga de Drama',
    xpReward: 500,
    iconUrl: '/badges/drama-veterano.svg',
    condition: { type: 'GENRE_CHAPTERS_READ', genre: 'DRAMA', count: 100 },
    category: 'READING',
    difficulty: 'MEDIUM',
  },
  {
    badgeId: 'DRAMA_MAESTRO',
    name: 'Maestro del Drama',
    description: 'Lee 500 capítulos de manga de Drama',
    xpReward: 1500,
    iconUrl: '/badges/drama-maestro.svg',
    condition: { type: 'GENRE_CHAPTERS_READ', genre: 'DRAMA', count: 500 },
    category: 'READING',
    difficulty: 'HARD',
  },
];

/**
 * Inserta los logros en la base de datos
 */
async function seedAchievements() {
  console.log('🌱 Sembrando logros...');

  for (const achievement of achievements) {
    await prisma.achievementDefinition.upsert({
      where: { badgeId: achievement.badgeId },
      update: {
        name: achievement.name,
        description: achievement.description,
        xpReward: achievement.xpReward,
        iconUrl: achievement.iconUrl,
        condition: JSON.stringify(achievement.condition),
      },
      create: {
        badgeId: achievement.badgeId,
        name: achievement.name,
        description: achievement.description,
        xpReward: achievement.xpReward,
        iconUrl: achievement.iconUrl,
        condition: JSON.stringify(achievement.condition),
      },
    });
    console.log(`✅ Logro creado: ${achievement.name}`);
  }

  console.log('✨ Seed de logros completado');
}

export { seedAchievements };

// Ejecutar si es llamado directamente (ESM)
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  seedAchievements()
    .catch((e) => {
      console.error('❌ Error sembrando logros:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
