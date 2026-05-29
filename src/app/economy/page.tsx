import { Metadata } from 'next';
import { detectLocale } from '@/i18n/server';
import { getT } from '@/i18n/getT';
import { Coins, ArrowRightLeft, Wallet, Users, History } from 'lucide-react';
export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.economy.title');
  const description = t('page.economy.description');

  return {
    title,
    description,
  };
}

const sections = [
  {
    href: '/economy/transfer',
    icon: ArrowRightLeft,
    title: 'Enviar Aura',
    description: 'Transfiere Aura a otros usuarios. Comisión del 3%.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    href: '/economy/withdraw',
    icon: Wallet,
    title: 'Retirar',
    description: 'Retira Aura a tu cuenta bancaria. Mínimo 1,000 Aura.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    href: '/economy/referrals',
    icon: Users,
    title: 'Referencias',
    description: 'Invita amigos y gana 10% de su primera compra.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    href: '/economy/history',
    icon: History,
    title: 'Historial',
    description: 'Ver todas tus transacciones de Aura.',
    color: 'from-orange-500 to-amber-500',
  },
];

export default function EconomyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 pt-20 pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <Coins className="text-[var(--primary)]" size={30} /> Economía Aura
        </h1>
        <p className="text-muted">Gestiona tu Aura: transferencias, retiros, referidos e historial</p>
      </div>

      <div className="grid gap-4">
        {sections.map((section) => (
          <a
            key={section.href}
            href={section.href}
            className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 hover:border-[var(--primary)] transition-all"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-5 group-hover:opacity-10 transition-opacity`}
            />
            <div className="relative flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-gradient-to-br ${section.color}`}>
                <section.icon className="text-white" size={24} />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold group-hover:text-[var(--primary)] transition-colors">
                  {section.title}
                </h2>
                <p className="text-sm text-muted">{section.description}</p>
              </div>
              <ArrowRightLeft size={20} className="text-muted group-hover:translate-x-1 transition-transform" />
            </div>
          </a>
        ))}
      </div>

      <div className="mt-8 p-4 rounded-xl bg-[var(--muted)] border border-[var(--border)]">
        <h3 className="font-semibold mb-2">Cómo funciona</h3>
        <ul className="text-sm text-muted space-y-1">
          <li>• El Aura purchased puede transferirse y retirarse (requiere verificación KYC)</li>
          <li>• El Aura ganado (referencias) solo puede gastarse en la plataforma</li>
          <li>• Los retiros tienen 30% de comisión y requieren 30 días desde la primera compra</li>
          <li>• Las transferencias tienen 3% de comisión que se quema</li>
        </ul>
      </div>
    </div>
  );
}