import type { Metadata } from 'next';
import CollectionsPageContent from './CollectionsPageContent';

export const metadata: Metadata = {
  title: 'Colecciones | Inkverse',
  description: 'Explora y descubre colecciones de manga creadas por la comunidad',
  openGraph: {
    title: 'Colecciones | Inkverse',
    description: 'Explora colecciones de manga organizadas por la comunidad',
  },
};

export default function CollectionsPage() {
  return <CollectionsPageContent />;
}
