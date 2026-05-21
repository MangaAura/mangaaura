import { Shield, Lock, Eye, Server, Trash2, Mail, Check } from 'lucide-react';
import type { Metadata } from 'next';

import { Container } from '@/components/Layout/Container';
import { PageHeader } from '@/components/Layout/PageHeader';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';

export const metadata: Metadata = {
  title: 'Política de Privacidad - InkVerse',
  description: 'Cómo InkVerse recopila, usa y protege tu información personal',
  openGraph: {
    title: 'Política de Privacidad - InkVerse',
    description: 'Cómo InkVerse recopila, usa y protege tu información personal',
    type: 'website',
    siteName: 'InkVerse',
    locale: 'es_ES',
  },
};

export default async function PrivacyPage() {
  const locale = await detectLocale();
  const t = getT(locale);
  const lastUpdated = '29 de abril de 2026';

  const dataTypes = [
    {
      icon: <Eye className="w-5 h-5" aria-hidden="true" />,
      title: t('legal.privacy.accountInfo'),
      items: [t('legal.privacy.accountItem1'), t('legal.privacy.accountItem2'), t('legal.privacy.accountItem3'), t('legal.privacy.accountItem4')]
    },
    {
      icon: <Server className="w-5 h-5" aria-hidden="true" />,
      title: t('legal.privacy.usageData'),
      items: [t('legal.privacy.usageItem1'), t('legal.privacy.usageItem2'), t('legal.privacy.usageItem3'), t('legal.privacy.usageItem4')]
    },
    {
      icon: <Lock className="w-5 h-5" aria-hidden="true" />,
      title: t('legal.privacy.technicalInfo'),
      items: [t('legal.privacy.technicalItem1'), t('legal.privacy.technicalItem2'), t('legal.privacy.technicalItem3'), t('legal.privacy.technicalItem4')]
    }
  ];

  const rights = [
    { title: t('legal.privacy.access'), description: t('legal.privacy.accessDesc') },
    { title: t('legal.privacy.rectification'), description: t('legal.privacy.rectificationDesc') },
    { title: t('legal.privacy.deletion'), description: t('legal.privacy.deletionDesc') },
    { title: t('legal.privacy.portability'), description: t('legal.privacy.portabilityDesc') }
  ];

  return (
    <Container className="py-12">
      <PageHeader
        title={t('legal.privacy.title')}
        description={`${t('legal.dmca.lastUpdated')}: ${lastUpdated}`}
        icon={<Shield className="w-8 h-8" aria-hidden="true" />}
      />

      <div className="max-w-3xl mx-auto space-y-8">
        <div className="bg-secondary border border-custom rounded-2xl p-8 shadow-lg">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-accent-blue" aria-hidden="true" />
            {t('legal.privacy.infoCollect')}
          </h2>
          <p className="text-muted mb-6">
            {t('legal.privacy.infoCollectDesc')}
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            {dataTypes.map((type, _index) => (
              <div key={type.title} className="bg-tertiary border border-custom rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3 text-accent-blue">
                  {type.icon}
                  <h3 className="font-semibold text-sm">{type.title}</h3>
                </div>
                <ul className="space-y-1">
                  {type.items.map((item, i) => (
                    <li key={`item-${i}`} className="text-sm text-muted flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-accent-blue rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-secondary border border-custom rounded-2xl p-8 shadow-lg">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-accent-blue" />
            {t('legal.privacy.howUse')}
          </h2>
          <ul className="space-y-3 text-muted">
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 bg-accent-blue rounded-full mt-2 flex-shrink-0" />
              <span>{t('legal.privacy.use1')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 bg-accent-blue rounded-full mt-2 flex-shrink-0" />
              <span>{t('legal.privacy.use2')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 bg-accent-blue rounded-full mt-2 flex-shrink-0" />
              <span>{t('legal.privacy.use3')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 bg-accent-blue rounded-full mt-2 flex-shrink-0" />
              <span>{t('legal.privacy.use4')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 bg-accent-blue rounded-full mt-2 flex-shrink-0" />
              <span>{t('legal.privacy.use5')}</span>
            </li>
          </ul>
        </div>

        <div className="bg-secondary border border-custom rounded-2xl p-8 shadow-lg">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent-blue" />
            {t('legal.privacy.rights')}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {rights.map((right, _index) => (
              <div key={right.title} className="p-4 bg-tertiary border border-custom rounded-xl">
                <h3 className="font-semibold mb-1">{right.title}</h3>
                <p className="text-sm text-muted">{right.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-secondary border border-custom rounded-2xl p-8 shadow-lg">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-accent-blue" />
            {t('legal.privacy.dataSecurity')}
          </h2>
          <p className="text-muted mb-4">
            {t('legal.privacy.dataSecurityDesc')}
          </p>
          <ul className="space-y-2 text-muted">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[var(--success)]" aria-hidden="true" />
              {t('legal.privacy.security1')}
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[var(--success)]" aria-hidden="true" />
              {t('legal.privacy.security2')}
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[var(--success)]" aria-hidden="true" />
              {t('legal.privacy.security3')}
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[var(--success)]" aria-hidden="true" />
              {t('legal.privacy.security4')}
            </li>
          </ul>
        </div>

        <div className="bg-secondary border border-custom rounded-2xl p-8 shadow-lg">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-accent-blue" />
            {t('legal.privacy.retention')}
          </h2>
          <p className="text-muted">
            {t('legal.privacy.retentionDesc')}
          </p>
        </div>

        <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-2xl p-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-accent-blue">
            <Mail className="w-5 h-5" />
            {t('legal.privacy.contact')}
          </h2>
          <p className="text-muted mb-4">
            {t('legal.privacy.contactDesc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="mailto:privacy@inkverse.app"
              className="inline-flex items-center justify-center gap-2 bg-accent-blue hover:bg-accent-blue-hover text-[var(--text-inverse)] font-medium px-6 py-3 rounded-xl transition-colors"
            >
              <Mail className="w-4 h-4" />
              privacy@inkverse.app
            </a>
          </div>
        </div>
      </div>
    </Container>
  );
}
