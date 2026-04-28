/**
 * Party Reading Page
 *
 * Pagina para lectura en grupo usando el componente PartyReader.
 */

import { notFound } from 'next/navigation';
import PartyReader from '@/components/Reader/PartyReader';
import { partyService } from '@/core/services/PartyService';

interface PartyPageProps {
  params: Promise<{ slug: string }>;
}

// Datos mock de paginas para desarrollo
const MOCK_PAGES = [
  'https://via.placeholder.com/800x1200/10121a/5a6072?text=Page+1',
  'https://via.placeholder.com/800x1200/10121a/5a6072?text=Page+2',
  'https://via.placeholder.com/800x1200/10121a/5a6072?text=Page+3',
  'https://via.placeholder.com/800x1200/10121a/5a6072?text=Page+4',
  'https://via.placeholder.com/800x1200/10121a/5a6072?text=Page+5',
  'https://via.placeholder.com/800x1200/10121a/5a6072?text=Page+6',
  'https://via.placeholder.com/800x1200/10121a/5a6072?text=Page+7',
  'https://via.placeholder.com/800x1200/10121a/5a6072?text=Page+8',
  'https://via.placeholder.com/800x1200/10121a/5a6072?text=Page+9',
  'https://via.placeholder.com/800x1200/10121a/5a6072?text=Page+10',
];

export default async function PartyPage({ params }: PartyPageProps) {
  const { slug: partyId } = await params;

  // Verificar si el party existe
  const party = partyService.getParty(partyId);

  if (!party) {
    notFound();
  }

  // En una implementacion real, obtendriamos los datos del manga desde la base de datos
  // Por ahora usamos datos mock
  const mockMangaData = {
    title: 'Solo Leveling',
    pages: MOCK_PAGES,
    chapterNumber: 1,
  };

  return (
    <PartyReader
      partyId={partyId}
      pages={mockMangaData.pages}
      mangaId={party.mangaId}
      chapterId={party.chapterId}
      chapterNumber={mockMangaData.chapterNumber}
      mangaTitle={mockMangaData.title}
    />
  );
}
