import type { Metadata } from 'next';
import AuditLogClient from './AuditLogClient';

export const metadata: Metadata = {
  title: 'Registro de Auditoría | MangaAura',
  description: 'Revisa el registro de auditoría de actividades administrativas en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Registro de Auditoría | MangaAura',
    description: 'Revisa el registro de auditoría de actividades administrativas en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Registro de Auditoría | MangaAura',
    description: 'Registro de auditoría administrativa en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/audit-log' },
};

export default function AuditLogPage(props: any) {
  return <AuditLogClient {...props} />;
}
