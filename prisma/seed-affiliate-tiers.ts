import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const AFFILIATE_TIERS = [
  {
    name: 'Bronze',
    description: 'Perfecto para empezar. Comparte tu enlace y gana comisiones por cada usuario que se registre y compre Aura.',
    minReferrals: 0,
    minRevenue: 0,
    commissionRate: 0.10,
    recurringMonths: 3,
    priority: 0,
  },
  {
    name: 'Silver',
    description: 'Para afiliados activos. Comisiones más altas y acceso a materiales promocionales exclusivos.',
    minReferrals: 5,
    minRevenue: 5000, // $50 en compras de referidos
    commissionRate: 0.15,
    recurringMonths: 6,
    priority: 1,
  },
  {
    name: 'Gold',
    description: 'Afiliados destacados. Prioridad en pagos, landing page personalizada y analytics avanzados.',
    minReferrals: 20,
    minRevenue: 50000, // $500 en compras de referidos
    commissionRate: 0.20,
    recurringMonths: 12,
    monthlyPayoutLimit: 100000, // 100,000 Aura/mes
    priority: 2,
  },
  {
    name: 'Platinum',
    description: 'Elite de afiliados. Comisión máxima, cuenta manager dedicada y acceso anticipado a features.',
    minReferrals: 50,
    minRevenue: 250000, // $2,500 en compras de referidos
    commissionRate: 0.25,
    recurringMonths: 0, // lifetime (sin límite)
    monthlyPayoutLimit: null, // sin límite
    priority: 3,
  },
];

async function seedAffiliateTiers() {
  console.log('🌱 Seeding affiliate tiers...');

  for (const tier of AFFILIATE_TIERS) {
    await prisma.affiliateTier.upsert({
      where: { name: tier.name },
      update: {
        description: tier.description,
        minReferrals: tier.minReferrals,
        minRevenue: tier.minRevenue,
        commissionRate: tier.commissionRate,
        recurringMonths: tier.recurringMonths,
        monthlyPayoutLimit: tier.monthlyPayoutLimit,
        priority: tier.priority,
      },
      create: {
        name: tier.name,
        description: tier.description,
        minReferrals: tier.minReferrals,
        minRevenue: tier.minRevenue,
        commissionRate: tier.commissionRate,
        recurringMonths: tier.recurringMonths,
        monthlyPayoutLimit: tier.monthlyPayoutLimit,
        priority: tier.priority,
      },
    });
    console.log(`  ✅ ${tier.name} (${(tier.commissionRate * 100).toFixed(0)}%)`);
  }

  console.log('✅ Affiliate tiers seeded successfully!');
}

seedAffiliateTiers()
  .catch((e) => {
    console.error('❌ Error seeding affiliate tiers:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
