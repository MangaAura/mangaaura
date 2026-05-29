import type { Metadata } from 'next';
import PromptHunterClient from './PromptHunterClient';

export const metadata: Metadata = {
  title: 'Prompts de IA | MangaAura',
  description: 'Explora y comparte prompts para generación de arte de manga con IA en MangaAura.',
  openGraph: {
    title: 'Prompts de IA | MangaAura',
    description: 'Explora y comparte prompts para generación de arte de manga con IA en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prompts de IA | MangaAura',
    description: 'Explora prompts de IA para manga en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/prompts' },
};

export default function PromptHunterPage(props: any) {
  return <PromptHunterClient {...props} />;
}
