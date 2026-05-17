import type { Metadata } from 'next';
import { Container } from '@/components/Layout/Container';
import { PageHeader } from '@/components/Layout/PageHeader';
import { Scale, AlertTriangle, FileCheck, Mail, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';

export const metadata: Metadata = {
  title: 'Política DMCA - InkVerse',
  description: 'Procedimiento para reportar contenido que infringe derechos de autor',
};

export default async function DMCAPage() {
  const locale = await detectLocale();
  const t = getT(locale);
  const lastUpdated = '29 de abril de 2026';

  const takedownSteps = [
    { number: '1', title: t('legal.dmca.step1Title'), description: t('legal.dmca.step1Desc') },
    { number: '2', title: t('legal.dmca.step2Title'), description: t('legal.dmca.step2Desc') },
    { number: '3', title: t('legal.dmca.step3Title'), description: t('legal.dmca.step3Desc') },
    { number: '4', title: t('legal.dmca.step4Title'), description: t('legal.dmca.step4Desc') }
  ];

  const requirements = [
    t('legal.dmca.req1'),
    t('legal.dmca.req2'),
    t('legal.dmca.req3'),
    t('legal.dmca.req4'),
    t('legal.dmca.req5'),
    t('legal.dmca.req6')
  ];

  return (
    <Container className="py-12">
      <PageHeader
        title={t('legal.dmca.title')}
        description={`${t('legal.dmca.lastUpdated')}: ${lastUpdated}`}
        icon={<Scale className="w-8 h-8" />}
      />

      <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-[var(--warning)]/10 border border-[var(--warning)]/30 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-[var(--warning)] flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="font-bold text-[var(--warning)] mb-2">{t('legal.dmca.important')}</h2>
              <p className="text-muted text-sm">
                {t('legal.dmca.importantDesc')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-secondary border border-custom rounded-2xl p-8 shadow-lg">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-accent-blue" />
            {t('legal.dmca.process')}
          </h2>
          <p className="text-muted mb-6">
            {t('legal.dmca.processDesc')}
          </p>

          <div className="space-y-4">
            {takedownSteps.map((step, _index) => (
              <div key={`step-${step.number}`} className="flex gap-4 p-4 bg-tertiary border border-custom rounded-xl">
                <div className="w-8 h-8 bg-accent-blue text-[var(--text-inverse)] rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  {step.number}
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{step.title}</h3>
                  <p className="text-sm text-muted">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-secondary border border-custom rounded-2xl p-8 shadow-lg">
          <h2 className="text-xl font-bold mb-4">{t('legal.dmca.requirements')}</h2>
          <p className="text-muted mb-4">
            {t('legal.dmca.requirementsDesc')}
          </p>
          <ul className="space-y-3">
            {requirements.map((req, index) => (
              <li key={`req-${index}`} className="flex items-start gap-3 text-muted">
                <span className="w-2 h-2 bg-accent-blue rounded-full mt-2 flex-shrink-0" />
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-secondary border border-custom rounded-2xl p-8 shadow-lg">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-accent-blue" />
            {t('legal.dmca.agent')}
          </h2>
          <p className="text-muted mb-4">
            {t('legal.dmca.agentDesc')}
          </p>
          <div className="bg-tertiary border border-custom rounded-xl p-4">
            <p className="font-semibold">{t('legal.dmca.agentName')}</p>
            <p className="text-muted text-sm">{t('legal.dmca.agentEmail')}</p>
            <p className="text-muted text-sm">{t('legal.dmca.agentAddress')}</p>
          </div>
        </div>

        <div className="bg-secondary border border-custom rounded-2xl p-8 shadow-lg">
          <h2 className="text-xl font-bold mb-4">{t('legal.dmca.counterNotice')}</h2>
          <p className="text-muted mb-4">
            {t('legal.dmca.counterNoticeDesc')}
          </p>
          <ul className="space-y-2 text-muted">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-accent-blue rounded-full mt-2" />
              {t('legal.dmca.counter1')}
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-accent-blue rounded-full mt-2" />
              {t('legal.dmca.counter2')}
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-accent-blue rounded-full mt-2" />
              {t('legal.dmca.counter3')}
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-accent-blue rounded-full mt-2" />
              {t('legal.dmca.counter4')}
            </li>
          </ul>
        </div>

        <div className="bg-secondary border border-custom rounded-2xl p-8 shadow-lg">
          <h2 className="text-xl font-bold mb-4">{t('legal.dmca.repeatInfringers')}</h2>
          <p className="text-muted">
            {t('legal.dmca.repeatInfringersDesc')}
          </p>
        </div>

        <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-2xl p-8">
          <h2 className="text-xl font-bold mb-4 text-accent-blue">{t('legal.dmca.needHelp')}</h2>
          <p className="text-muted mb-4">
            {t('legal.dmca.needHelpDesc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-accent-blue hover:bg-accent-blue-hover text-[var(--text-inverse)] font-medium px-6 py-3 rounded-xl transition-colors"
            >
              <Mail className="w-4 h-4" />
              {t('legal.dmca.contactSupport')}
            </Link>
            <a
              href="https://www.copyright.gov/title17"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-tertiary hover:bg-tertiary/80 text-fg-primary font-medium px-6 py-3 rounded-xl transition-colors border border-custom"
            >
              <ExternalLink className="w-4 h-4" />
              {t('legal.dmca.copyrightLaw')}
            </a>
          </div>
        </div>
      </div>
    </Container>
  );
}
