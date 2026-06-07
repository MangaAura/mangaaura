'use client';

import { useState } from 'react';
import { CheckCircle2, Database, Loader2, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

interface SeedResult {
  slug: string;
  status: string;
}

export default function SeedBlogClient() {
  const [results, setResults] = useState<SeedResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch('/api/admin/news/seed', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al insertar artículos');
      setResults(data.results);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Insertar artículos de blog (fase 2)
          </CardTitle>
          <CardDescription>
            Inserta 10 artículos SEO optimizados en el blog de MangaAura.
            Solo visible para administradores. Los artículos ya existentes se saltan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleSeed} disabled={loading} size="lg" className="w-full">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {loading ? 'Insertando...' : 'Insertar 10 artículos'}
          </Button>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {results && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--text-secondary)]">Resultados:</p>
              {results.map((r) => (
                <div
                  key={r.slug}
                  className={`flex items-center gap-2 p-2 rounded text-sm ${
                    r.status === 'created'
                      ? 'bg-green-500/10 text-green-500'
                      : r.status === 'already exists'
                      ? 'bg-blue-500/10 text-blue-500'
                      : 'bg-red-500/10 text-red-500'
                  }`}
                >
                  {r.status === 'created' ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span className="flex-1 truncate">{r.slug}</span>
                  <span className="text-xs opacity-75">{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
