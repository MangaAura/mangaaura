import type { Metadata } from 'next';

import EventsPageContent from './EventsPageContent';

export const metadata: Metadata = {
  title: 'Eventos | MangaAura',
  description: 'Participa en desafíos de arte IA, votaciones y eventos de la comunidad',
};

export default function EventsPage() {
  return <EventsPageContent />;
}
