import type { Metadata } from 'next';
import { QuestsPageClient } from './QuestsPageClient';

export const metadata: Metadata = {
  title: 'Misiones | Inkverse',
  description: 'Completa misiones diarias y semanales para ganar XP y monedas',
};

export default function QuestsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Misiones</h1>
        <p className="text-muted">Completa misiones diarias y semanales para ganar XP y monedas</p>
      </div>
      <QuestsPageClient />
    </div>
  );
}
