import type { Metadata } from 'next';

import EventsPageContent from './EventsPageContent';

export const metadata: Metadata = {
  title: 'Eventos | Inkverse',
  description: 'Participa en desafíos de arte IA, votaciones y eventos de la comunidad',
};

export default function EventsPage() {
  return <EventsPageContent />;
}
