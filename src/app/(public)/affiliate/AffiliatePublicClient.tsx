'use client';

import { motion } from 'framer-motion';
import {
  Award,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Gift,
  Globe,
  Percent,
  Rocket,
  Share2,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';

import { Container } from '@/components/Layout/Container';
import { cn } from '@/lib/utils';

const TIERS = [
  {
    name: 'Bronze',
    rate: '10%',
    minReferrals: 0,
    recurring: '3 meses',
    color: 'from-amber-600 to-amber-800',
    border: 'border-amber-700/30',
    glow: 'shadow-amber-700/20',
    popular: false,
    features: [
      'Comisión del 10% en Aura',
      '3 meses de comisiones recurrentes',
      'Enlace de referido personalizado',
      'Dashboard básico de estadísticas',
    ],
  },
  {
    name: 'Silver',
    rate: '15%',
    minReferrals: 5,
    recurring: '6 meses',
    color: 'from-slate-300 to-slate-500',
    border: 'border-slate-400/30',
    glow: 'shadow-slate-400/20',
    popular: false,
    features: [
      'Comisión del 15% en Aura',
      '6 meses de comisiones recurrentes',
      'Materiales promocionales exclusivos',
      'Analytics avanzados',
      'Código promocional personalizado',
    ],
  },
  {
    name: 'Gold',
    rate: '20%',
    minReferrals: 20,
    recurring: '12 meses',
    color: 'from-yellow-400 to-yellow-600',
    border: 'border-yellow-500/30',
    glow: 'shadow-yellow-500/20',
    popular: true,
    features: [
      'Comisión del 20% en Aura',
      '12 meses de comisiones recurrentes',
      'Landing page personalizada',
      'Prioridad en pagos',
      'Analytics avanzados en tiempo real',
      'Soporte prioritario',
    ],
  },
  {
    name: 'Platinum',
    rate: '25%',
    minReferrals: 50,
    recurring: 'De por vida',
    color: 'from-purple-400 to-blue-500',
    border: 'border-purple-500/30',
    glow: 'shadow-purple-500/20',
    popular: false,
    features: [
      'Comisión del 25% en Aura',
      'Comisiones recurrentes de por vida',
      'Account manager dedicado',
      'Acceso anticipado a features',
      'Eventos exclusivos para afiliados',
      'Sin límite de payout mensual',
    ],
  },
];

const BENEFITS = [
  {
    icon: Percent,
    title: 'Comisiones altas',
    desc: 'Gana hasta un 25% de comisión por cada compra de tus referidos. Mientras más creces, más ganas.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: TrendingUp,
    title: 'Ingresos recurrentes',
    desc: 'No ganas solo una vez. Tus comisiones se renuevan mes a mes —hasta 12 meses o incluso de por vida.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Gift,
    title: 'Sin inversión inicial',
    desc: 'El programa es 100% gratuito. No hay costos de registro ni cuotas mensuales. Empieza a ganar desde el día 1.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: BarChart3,
    title: 'Analytics en tiempo real',
    desc: 'Dashboard completo con clicks, conversiones, comisiones y earnings. Sabrás exactamente cómo rinde tu contenido.',
    color: 'from-orange-500 to-amber-500',
  },
  {
    icon: Globe,
    title: 'Materiales promocionales',
    desc: 'Accede a banners, landing pages y templates optimizados para compartir en redes sociales, YouTube, Twitch y blogs.',
    color: 'from-rose-500 to-red-500',
  },
  {
    icon: Shield,
    title: 'Attribución de 90 días',
    desc: 'Cookie de 90 días. Si un usuario hace clic en tu enlace y se registra hasta 90 días después, la comisión es tuya.',
    color: 'from-indigo-500 to-violet-500',
  },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    icon: Users,
    title: 'Regístrate como afiliado',
    desc: 'Crea tu cuenta en MangaAura y solicita acceso al programa de afiliados desde tu dashboard.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    step: 2,
    icon: Share2,
    title: 'Comparte tu enlace único',
    desc: 'Usa tu enlace de referido personalizado en redes sociales, YouTube, blogs, o donde tenga sentido para tu audiencia.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    step: 3,
    icon: Target,
    title: 'Atrae usuarios',
    desc: 'Cuando alguien hace clic en tu enlace y se registra, queda vinculado a ti por 90 días. No necesita comprar al instante.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    step: 4,
    icon: TrendingUp,
    title: 'Gana comisiones',
    desc: 'Cada vez que uno de tus referidos compre Aura o se suscriba, recibirás un porcentaje automáticamente.',
    color: 'from-orange-500 to-amber-500',
  },
  {
    step: 5,
    icon: Award,
    title: 'Sube de nivel',
    desc: 'Acumula referidos e ingresos para subir de tier. Mejores comisiones y más beneficios te esperan.',
    color: 'from-yellow-500 to-rose-500',
  },
];

export default function AffiliatePublicClient() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/10 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <Container className="py-12 relative z-10">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-500 text-sm font-medium mb-6">
            <Sparkles size={14} />
            Nuevo — Programa de Afiliados MangaAura
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
            Gana{' '}
            <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
              comisiones
            </span>{' '}
            compartiendo{' '}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              manga
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-muted max-w-2xl mx-auto mb-8">
            El primer programa de afiliados para amantes del manga. Comparte tu pasión, refiere usuarios a
            MangaAura y gana hasta un <strong className="text-foreground">25% de comisión recurrente</strong>.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register?ref=affiliate"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all hover:scale-105"
            >
              <Rocket size={20} />
              Unirme al programa
              <ChevronRight size={16} />
            </Link>
            <Link
              href="#como-funciona"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--surface)] border border-[var(--border)] text-foreground font-medium rounded-2xl hover:border-purple-500/50 transition-all"
            >
              Cómo funciona
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted">
            <span className="flex items-center gap-1">
              <CheckCircle2 size={14} className="text-green-500" /> Sin costo
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={14} className="text-green-500" /> Pago en Aura
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={14} className="text-green-500" /> Cookie 90 días
            </span>
          </div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16 max-w-3xl mx-auto"
        >
          {[
            { value: '10-25%', label: 'Comisión', icon: Percent },
            { value: '3-∞', label: 'Meses recurrencia', icon: TrendingUp },
            { value: '90 días', label: 'Ventana atribución', icon: Target },
            { value: '4 niveles', label: 'Tiers disponibles', icon: Award },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-center"
            >
              <stat.icon className="w-5 h-5 mx-auto mb-1 text-purple-500" />
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* How it works */}
        <motion.div
          id="como-funciona"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Cómo funciona</h2>
            <p className="text-muted max-w-xl mx-auto">
              En solo 5 pasos puedes empezar a generar ingresos compartiendo lo que te apasiona
            </p>
          </div>
          <div className="grid md:grid-cols-5 gap-4">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-center"
              >
                <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white text-xs font-bold flex items-center justify-center">
                  {step.step}
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
                <p className="text-xs text-muted">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">¿Por qué ser afiliado?</h2>
            <p className="text-muted max-w-xl mx-auto">
              Todo lo que necesitas para convertir tu pasión por el manga en ingresos
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {BENEFITS.map((benefit) => (
              <div
                key={benefit.title}
                className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-purple-500/30 transition-all"
              >
                <div className={`w-10 h-10 bg-gradient-to-br ${benefit.color} rounded-lg flex items-center justify-center mb-3`}>
                  <benefit.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold mb-1">{benefit.title}</h3>
                <p className="text-sm text-muted">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tiers comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Niveles de afiliado</h2>
            <p className="text-muted max-w-xl mx-auto">
              Empieza en Bronze y escala a medida que creces. Cada nivel desbloquea mejores comisiones y beneficios
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={cn(
                  'relative p-6 rounded-xl bg-[var(--surface)] border transition-all hover:scale-105',
                  tier.popular ? 'border-purple-500/50 ring-1 ring-purple-500/20' : 'border-[var(--border)]',
                )}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold">
                    Más popular
                  </div>
                )}
                <div className={`w-12 h-12 bg-gradient-to-br ${tier.color} rounded-xl flex items-center justify-center mb-3`}>
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-1">{tier.name}</h3>
                <p className="text-3xl font-extrabold mb-1">{tier.rate}</p>
                <p className="text-xs text-muted mb-4">comisión + {tier.recurring} recurrencia</p>
                <ul className="space-y-2 mb-6">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 size={14} className="text-green-500 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 p-8 sm:p-12 text-center mb-12"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 pointer-events-none" />
          <div className="relative">
            <Rocket className="w-12 h-12 mx-auto mb-4 text-purple-500" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              ¿Listo para empezar?
            </h2>
            <p className="text-muted max-w-lg mx-auto mb-6">
          Únete al programa de afiliados de MangaAura y empieza a ganar comisiones compartiendo el manga que te apasiona.
            </p>
            <Link
              href="/auth/register?ref=affiliate"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all hover:scale-105"
            >
              <Users size={20} />
              Quiero ser afiliado
              <ChevronRight size={16} />
            </Link>
          </div>
        </motion.div>
      </Container>
    </div>
  );
}
