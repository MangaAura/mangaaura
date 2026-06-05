/**
 * Seed de announcements (Anuncios) para MangaAura
 *
 * Uso: npx tsx prisma/seed-announcements.ts
 */

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const ANNOUNCEMENTS = [
  {
    message: '🎉 ¡Bienvenidos a la nueva temporada de clanes! Competid por premios exclusivos hasta el 15 de agosto.',
    messageEn: '🎉 Welcome to the new clan season! Compete for exclusive prizes until August 15th.',
    type: 'info',
    priority: 'normal',
    style: 'banner',
    startAt: new Date('2026-06-01T00:00:00Z'),
    expiresAt: new Date('2026-08-15T23:59:59Z'),
  },
  {
    message: '🚀 El nuevo lector con modo página está disponible. Usa menos RAM y es más rápido en móviles.',
    messageEn: '🚀 The new paged reader mode is now available. Uses less RAM and is faster on mobile.',
    type: 'info',
    priority: 'normal',
    style: 'toast',
    startAt: new Date('2026-05-01T00:00:00Z'),
    expiresAt: null,
  },
  {
    message: '⚠️ Mantenimiento programado: El 20 de junio de 02:00 a 04:00 UTC la plataforma estará offline.',
    messageEn: '⚠️ Scheduled maintenance: June 20th from 02:00 to 04:00 UTC. The platform will be offline.',
    type: 'maintenance',
    priority: 'high',
    style: 'modal',
    startAt: new Date('2026-06-18T00:00:00Z'),
    expiresAt: new Date('2026-06-21T00:00:00Z'),
  },
  {
    message: '✨ Nuevas herramientas de IA para creadores: generación de personajes, fondos y retoque avanzado.',
    messageEn: '✨ New AI tools for creators: character generation, backgrounds, and advanced retouching.',
    type: 'info',
    priority: 'low',
    style: 'banner',
    startAt: new Date('2026-05-15T00:00:00Z'),
    expiresAt: null,
  },
  {
    message: '🔥 Concurso de manga de julio: "Mundos Paralelos". 5000 Aura de premio + insignia exclusiva.',
    messageEn: '🔥 July manga contest: "Parallel Worlds". 5000 Aura prize + exclusive badge.',
    type: 'alert',
    priority: 'normal',
    style: 'banner',
    startAt: new Date('2026-07-01T00:00:00Z'),
    expiresAt: new Date('2026-07-31T23:59:59Z'),
  },
  {
    message: '📱 La beta de la app móvil de MangaAura ya está disponible para iOS y Android.',
    messageEn: '📱 The MangaAura mobile app beta is now available for iOS and Android.',
    type: 'info',
    priority: 'normal',
    style: 'toast',
    startAt: new Date('2026-05-01T00:00:00Z'),
    expiresAt: null,
  },
];

async function seedAnnouncements() {
  console.log('📢 Sembrando anuncios...');

  // Buscar un admin para asignar como creador
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true },
  });

  if (!admin) {
    console.error(
      '❌ No se encontró ningún usuario admin. ' +
        'Ejecuta primero `npx tsx prisma/seed.ts` para crear usuarios de prueba.',
    );
    process.exit(1);
  }

  console.log(`✅ Admin encontrado: ${admin.id}`);

  let created = 0;
  let skipped = 0;

  for (const ann of ANNOUNCEMENTS) {
    // Usar message como identificador único para upsert
    const existing = await prisma.announcement.findFirst({
      where: { message: ann.message, createdBy: admin.id },
      select: { id: true },
    });

    if (existing) {
      console.log(`⏭️  Ya existe: "${ann.message.slice(0, 50)}..."`);
      skipped++;
      continue;
    }

    await prisma.announcement.create({
      data: {
        message: ann.message,
        messageEn: ann.messageEn,
        type: ann.type,
        priority: ann.priority,
        style: ann.style,
        isActive: true,
        startAt: ann.startAt,
        expiresAt: ann.expiresAt,
        createdBy: admin.id,
      },
    });

    console.log(`✅ Creado: "${ann.message.slice(0, 50)}..."`);
    created++;
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   Creados: ${created}`);
  console.log(`   Saltados (ya existían): ${skipped}`);
  console.log(`   Total: ${ANNOUNCEMENTS.length}`);
  console.log('✨ Seed de anuncios completado');
}

seedAnnouncements()
  .catch((e) => {
    console.error('❌ Error sembrando anuncios:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
