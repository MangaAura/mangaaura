import { Metadata } from 'next';

import { GenerateImageClient } from './GenerateImageClient';

export const metadata: Metadata = {
  title: 'Generar Imagen con IA | MangaAura',
  description: 'Genera imágenes únicas usando IA con Aura',
};

export default function GenerateImagePage() {
  return <GenerateImageClient />;
}
