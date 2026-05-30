import type { Metadata } from 'next';

import AuditLogsClient from './AuditLogsClient';

export const metadata: Metadata = {
  title: 'Registros de Auditoría | MangaAura',
  description: 'Consulta los registros de auditoría detallados de MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Registros de Auditoría | MangaAura',
    description: 'Consulta los registros de auditoría detallados de MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Registros de Auditoría | MangaAura',
    description: 'Consulta los registros de auditoría de MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/audit-logs' },
};

export default function AuditLogsPage(props: any) {
  return <AuditLogsClient {...props} />;
}
