import { readFileSync } from 'fs';
import { join } from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  const filePath = join(process.cwd(), 'public/data/comparison-data.json');
  const raw = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);

  return NextResponse.json(data, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      'X-Robots-Tag': 'all',
    },
  });
}
