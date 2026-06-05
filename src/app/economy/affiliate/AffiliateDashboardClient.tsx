'use client';

import {
  Award,
  BarChart3,
  CheckCircle2,
  Copy,
  Gift,
  Globe,
  MessageCircle,
  Send,
  Share2,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

interface AffiliateData {
  status: string;
  since: string | null;
  referralCode: string | null;
  promoCode: string | null;
  totalEarned: number;
  payoutMethod: string | null;
  currentTier: {
    name: string;
    commissionRate: number;
    priority: number;
    monthlyPayoutLimit: number | null;
  } | null;
  nextTier: {
    name: string;
    commissionRate: number;
    minReferrals: number;
    minRevenue: number;
  } | null;
  stats: {
    totalClicks: number;
    conversions: number;
    conversionRate: number;
    totalPending: number;
    totalPaid: number;
    monthlyEarnings: number;
  };
  recentReferrals: Array<{
    id: string;
    clickedAt: string;
    convertedAt: string | null;
    firstPurchaseAt: string | null;
    totalPurchases: number;
    totalCommission: number;
    source: string | null;
    campaign: string | null;
  }>;
  recentCommissions: Array<{
    id: string;
    amount: number;
    rate: number;
    purchaseAmount: number;
    purchaseType: string;
    status: string;
    createdAt: string;
    paidAt: string | null;
  }>;
}

const TIER_COLORS: Record<string, string> = {
  Bronze: 'from-amber-600 to-amber-800',
  Silver: 'from-slate-300 to-slate-500',
  Gold: 'from-yellow-400 to-yellow-600',
  Platinum: 'from-purple-400 to-blue-500',
};

export function AffiliateDashboardClient({ data }: { data: AffiliateData }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'commissions' | 'referrals'>('overview');

  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/register?ref=${data.referralCode || data.promoCode}`
    : '';

  async function copyLink(link: string) {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleShare(platform: string) {
    const text = `¡Descubre MangaAura! La plataforma para crear y leer manga con IA. Únete con mi enlace: ${referralLink}`;
    let url = '';
    switch (platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Descubre MangaAura 🎉')}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
        break;
    }
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  const tabs = [
    { id: 'overview' as const, label: 'Resumen', icon: BarChart3 },
    { id: 'commissions' as const, label: 'Comisiones', icon: Gift },
    { id: 'referrals' as const, label: 'Referidos', icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Award className="text-purple-500" size={24} /> Dashboard de Afiliados
          </h1>
          <p className="text-muted text-sm">
            {data.currentTier && (
              <>Nivel actual: <span className="font-semibold text-purple-500">{data.currentTier.name}</span></>
            )}
            {data.since && (
              <> · Afiliado desde {new Date(data.since).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}</>
            )}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${data.currentTier ? TIER_COLORS[data.currentTier.name] || 'from-purple-500 to-blue-500' : 'from-gray-500 to-gray-600'} flex items-center justify-center`}>
          <Award className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Tier progress */}
      {data.nextTier && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-amber-500" size={18} />
            <span className="text-sm font-semibold">Próximo nivel: {data.nextTier.name} ({(data.nextTier.commissionRate * 100).toFixed(0)}% comisión)</span>
          </div>
          <div className="text-xs text-muted mb-2">
            {data.nextTier.minReferrals > 0 && `Mín. ${data.nextTier.minReferrals} referidos`}
            {data.nextTier.minRevenue > 0 && ` · Mín. $${(data.nextTier.minRevenue / 100).toFixed(2)} en ingresos generados`}
          </div>
        </div>
      )}

      {/* Share link */}
      <div className="p-5 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30">
        <div className="flex items-center gap-2 mb-2">
          <Share2 className="text-purple-500" size={18} />
          <span className="text-sm font-medium text-purple-500">Tu enlace de afiliado</span>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm font-mono bg-[var(--surface)] px-3 py-2 rounded-lg border border-[var(--border)] truncate">
            {referralLink || 'Cargando...'}
          </code>
          <button
            onClick={() => copyLink(referralLink)}
            className="p-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors shrink-0"
          >
            {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
          </button>
        </div>
        {data.promoCode && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-muted">Código promocional:</span>
            <code className="text-xs font-bold text-purple-500">{data.promoCode}</code>
          </div>
        )}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-xs text-muted mr-1">Compartir en:</span>
          {[
            { id: 'whatsapp', icon: MessageCircle, color: 'bg-green-500/20 text-green-500 hover:bg-green-500/30' },
            { id: 'twitter', icon: Globe, color: 'bg-blue-400/20 text-blue-400 hover:bg-blue-400/30' },
            { id: 'telegram', icon: Send, color: 'bg-blue-500/20 text-blue-500 hover:bg-blue-500/30' },
            { id: 'facebook', icon: Share2, color: 'bg-blue-600/20 text-blue-600 hover:bg-blue-600/30' },
          ].map(social => (
            <button
              key={social.id}
              onClick={() => handleShare(social.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${social.color}`}
            >
              <social.icon size={14} />
              {social.id.charAt(0).toUpperCase() + social.id.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-lg bg-[var(--muted)] border border-[var(--border)]">
          <p className="text-xs text-muted mb-1">Comisión actual</p>
          <p className="text-xl font-bold">{(data.currentTier?.commissionRate ?? 0.1) * 100}%</p>
        </div>
        <div className="p-4 rounded-lg bg-[var(--muted)] border border-[var(--border)]">
          <p className="text-xs text-muted mb-1">Ganancias del mes</p>
          <p className="text-xl font-bold text-purple-500">{data.stats.monthlyEarnings}</p>
        </div>
        <div className="p-4 rounded-lg bg-[var(--muted)] border border-[var(--border)]">
          <p className="text-xs text-muted mb-1">Pendiente</p>
          <p className="text-xl font-bold text-amber-500">{data.stats.totalPending}</p>
        </div>
        <div className="p-4 rounded-lg bg-[var(--muted)] border border-[var(--border)]">
          <p className="text-xs text-muted mb-1">Pagado</p>
          <p className="text-xl font-bold text-green-500">{data.stats.totalPaid}</p>
        </div>
        <div className="p-4 rounded-lg bg-[var(--muted)] border border-[var(--border)]">
          <p className="text-xs text-muted mb-1">Total ganado</p>
          <p className="text-xl font-bold">{data.totalEarned}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-lg bg-[var(--muted)] border border-[var(--border)]">
          <div className="flex items-center gap-2 mb-1">
            <Target size={14} className="text-blue-500" />
            <p className="text-xs text-muted">Clicks totales</p>
          </div>
          <p className="text-lg font-bold">{data.stats.totalClicks}</p>
        </div>
        <div className="p-4 rounded-lg bg-[var(--muted)] border border-[var(--border)]">
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-green-500" />
            <p className="text-xs text-muted">Conversiones</p>
          </div>
          <p className="text-lg font-bold">{data.stats.conversions}</p>
        </div>
        <div className="p-4 rounded-lg bg-[var(--muted)] border border-[var(--border)]">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-purple-500" />
            <p className="text-xs text-muted">Tasa conversión</p>
          </div>
          <p className="text-lg font-bold">{data.stats.conversionRate}%</p>
        </div>
        <div className="p-4 rounded-lg bg-[var(--muted)] border border-[var(--border)]">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={14} className="text-amber-500" />
            <p className="text-xs text-muted">Método de pago</p>
          </div>
          <p className="text-lg font-bold capitalize">{data.payoutMethod || 'No configurado'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--border)] pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === tab.id
                ? 'bg-purple-500/20 text-purple-500'
                : 'text-muted hover:text-foreground hover:bg-[var(--muted)]'
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Users size={16} className="text-blue-500" /> Referidos recientes
            </h3>
            {data.recentReferrals.length === 0 ? (
              <div className="text-center py-8 text-muted text-sm">
                Aún no tienes referidos. ¡Comparte tu enlace!
              </div>
            ) : (
              <div className="space-y-2">
                {data.recentReferrals.slice(0, 5).map(ref => (
                  <div key={ref.id} className="flex items-center justify-between text-sm py-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${ref.convertedAt ? 'bg-green-500' : 'bg-amber-500'}`} />
                      <span className="text-muted">
                        {new Date(ref.clickedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </span>
                      <span className="text-xs text-muted">{ref.source || 'directo'}</span>
                    </div>
                    <span className={ref.convertedAt ? 'text-green-500 text-xs' : 'text-amber-500 text-xs'}>
                      {ref.convertedAt ? 'Convertido' : 'Click'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Gift size={16} className="text-purple-500" /> Últimas comisiones
            </h3>
            {data.recentCommissions.length === 0 ? (
              <div className="text-center py-8 text-muted text-sm">
                Aún no hay comisiones. Cuando tus referidos compren Aura, aparecerán aquí.
              </div>
            ) : (
              <div className="space-y-2">
                {data.recentCommissions.slice(0, 5).map(c => (
                  <div key={c.id} className="flex items-center justify-between text-sm py-1">
                    <div>
                      <span className="text-muted">{new Date(c.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                      <span className="text-xs text-muted ml-2">{(c.rate * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-purple-500">+{c.amount}</span>
                      <span className={cn(
                        'text-xs px-1.5 py-0.5 rounded',
                        c.status === 'paid' ? 'bg-green-500/20 text-green-500' :
                        c.status === 'pending' ? 'bg-amber-500/20 text-amber-500' :
                        'bg-red-500/20 text-red-500'
                      )}>
                        {c.status === 'paid' ? 'Pagado' : c.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Commissions tab */}
      {activeTab === 'commissions' && (
        <div>
          <h3 className="font-semibold mb-3">Historial de comisiones</h3>
          {data.recentCommissions.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <Gift size={40} className="mx-auto mb-2 opacity-50" />
              <p>No hay comisiones todavía</p>
              <p className="text-sm">Comparte tu enlace para empezar a generar comisiones</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.recentCommissions.map(c => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--muted)] border border-[var(--border)]"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {c.purchaseType === 'aura' ? 'Compra de Aura' : 
                       c.purchaseType === 'subscription' ? 'Suscripción' : 
                       `Compra: ${c.purchaseType}`}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(c.createdAt).toLocaleDateString('es-ES', { 
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                      })}
                      {' · '}
                      {(c.rate * 100).toFixed(0)}% de ${(c.purchaseAmount / 100).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-purple-500">+{c.amount}</p>
                    <span className={cn(
                      'text-xs px-1.5 py-0.5 rounded',
                      c.status === 'paid' ? 'bg-green-500/20 text-green-500' :
                      c.status === 'pending' ? 'bg-amber-500/20 text-amber-500' :
                      'bg-red-500/20 text-red-500'
                    )}>
                      {c.status === 'paid' ? 'Pagado' : c.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Referrals tab */}
      {activeTab === 'referrals' && (
        <div>
          <h3 className="font-semibold mb-3">Referidos</h3>
          {data.recentReferrals.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <Users size={40} className="mx-auto mb-2 opacity-50" />
              <p>Aún no tienes referidos</p>
              <p className="text-sm">Comparte tu enlace de afiliado para empezar</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.recentReferrals.map(ref => (
                <div
                  key={ref.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--muted)] border border-[var(--border)]"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${ref.convertedAt ? 'bg-green-500' : 'bg-amber-500'}`} />
                    <div>
                      <p className="text-sm">
                        Click desde{' '}
                        <span className="font-medium">{ref.source || 'enlace directo'}</span>
                        {ref.campaign && <span className="text-muted"> · {ref.campaign}</span>}
                      </p>
                      <p className="text-xs text-muted">
                        {new Date(ref.clickedAt).toLocaleDateString('es-ES', { 
                          year: 'numeric', month: 'short', day: 'numeric' 
                        })}
                        {ref.convertedAt && (
                          <> · Convertido: {new Date(ref.convertedAt).toLocaleDateString('es-ES', { 
                            year: 'numeric', month: 'short', day: 'numeric' 
                          })}</>
                        )}
                        {ref.totalPurchases > 0 && (
                          <> · {ref.totalPurchases} compras · {ref.totalCommission} Aura generados</>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    'text-xs px-2 py-1 rounded',
                    ref.convertedAt ? 'bg-green-500/20 text-green-500' : 'bg-amber-500/20 text-amber-500'
                  )}>
                    {ref.convertedAt ? 'Convertido' : 'Pendiente'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
