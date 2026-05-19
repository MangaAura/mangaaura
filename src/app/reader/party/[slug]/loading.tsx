import { Loader2 } from 'lucide-react';

export default function PartyReadingLoading() {
  return (
    <div role="status" className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-[var(--primary)] mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
          Cargando lectura en grupo
        </h2>
        <p className="text-[var(--text-secondary)]">Preparando la sala...</p>
      </div>
    </div>
  );
}
