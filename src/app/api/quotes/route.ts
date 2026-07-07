import { NextResponse } from 'next/server';
import type { QuoteItem } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Yahoo Finance's unauthenticated "chart" endpoint (used widely by hobby
// finance dashboards) instead of their v7 "quote" endpoint, which now
// frequently requires a session crumb and 401s without one. The chart
// endpoint returns `meta.regularMarketPrice` and `meta.previousClose`,
// which is all we need for a live price + % change tile.
//
// Nifty 50 / Bank Nifty / India VIX live in /api/nse-quotes instead (backed
// by AngelOne SmartAPI when configured, Yahoo as a fallback) — this route
// only covers the globally-licensed instruments Yahoo serves cleanly.
const SYMBOLS: { id: string; label: string; yahooSymbol: string; unit: QuoteItem['unit']; scale?: number }[] = [
  { id: 'gold', label: 'GOLD ($/oz)', yahooSymbol: 'GC=F', unit: 'usd' },
  { id: 'silver', label: 'SILVER ($/oz)', yahooSymbol: 'SI=F', unit: 'usd' },
  { id: 'crude', label: 'CRUDE WTI ($/bbl)', yahooSymbol: 'CL=F', unit: 'usd' },
  { id: 'usdinr', label: 'USD/INR', yahooSymbol: 'INR=X', unit: 'inr' }
];

let cache: { data: QuoteItem[]; ts: number } | null = null;
const CACHE_TTL_MS = 15000;

async function fetchOne(entry: (typeof SYMBOLS)[number]): Promise<QuoteItem> {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${entry.yahooSymbol}?interval=1d&range=1d`,
    {
      next: { revalidate: 0 },
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MarketsDashboard/1.0)' }
    }
  );
  if (!res.ok) throw new Error(`Yahoo chart failed for ${entry.label}: ${res.status}`);
  const json = await res.json();
  const meta = json?.chart?.result?.[0]?.meta;
  if (!meta || typeof meta.regularMarketPrice !== 'number') {
    throw new Error(`Yahoo chart missing price for ${entry.label}`);
  }
  const price = meta.regularMarketPrice * (entry.scale ?? 1);
  const prevClose = (meta.previousClose ?? meta.chartPreviousClose ?? meta.regularMarketPrice) * (entry.scale ?? 1);
  const changePct = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;
  return { id: entry.id, label: entry.label, price, changePct, unit: entry.unit, source: 'yahoo' };
}

async function fetchAll(): Promise<QuoteItem[]> {
  const settled = await Promise.allSettled(SYMBOLS.map(fetchOne));
  return settled.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : { id: SYMBOLS[i]!.id, label: SYMBOLS[i]!.label, price: 0, changePct: 0, unit: SYMBOLS[i]!.unit, source: 'unavailable' as const }
  );
}

export async function GET() {
  try {
    if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
      return NextResponse.json(cache.data);
    }
    const data = await fetchAll();
    cache = { data, ts: Date.now() };
    return NextResponse.json(data);
  } catch (err) {
    if (cache) return NextResponse.json(cache.data, { headers: { 'X-Data-Stale': 'true' } });
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 502 });
  }
}
