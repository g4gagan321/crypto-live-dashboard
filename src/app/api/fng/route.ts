import { NextResponse } from 'next/server';
import type { FearGreedData } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

let cache: { data: FearGreedData; ts: number } | null = null;
const CACHE_TTL_MS = 60000;

// alternative.me Fear & Greed Index — free, no key required.
async function fetchFng(): Promise<FearGreedData> {
  const res = await fetch('https://api.alternative.me/fng/?limit=1', { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Fear & Greed request failed: ${res.status}`);
  const json = await res.json();
  const entry = json.data?.[0];
  if (!entry) throw new Error('Fear & Greed response missing data');
  return {
    value: Number(entry.value),
    label: entry.value_classification,
    timestamp: Number(entry.timestamp) * 1000
  };
}

export async function GET() {
  try {
    if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
      return NextResponse.json(cache.data);
    }
    const data = await fetchFng();
    cache = { data, ts: Date.now() };
    return NextResponse.json(data);
  } catch (err) {
    if (cache) return NextResponse.json(cache.data, { headers: { 'X-Data-Stale': 'true' } });
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 502 });
  }
}
