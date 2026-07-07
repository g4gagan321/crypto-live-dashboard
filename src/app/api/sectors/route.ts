import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export interface SectorItem {
  label: string;
  changePct: number;
}

// NSE sector index tickers as tracked by Yahoo Finance. Not every one of
// these resolves reliably on Yahoo's keyless endpoint, so each is fetched
// independently and any symbol that fails is simply omitted from the
// response rather than shown as a fabricated number.
const SECTORS: { label: string; yahooSymbol: string }[] = [
  { label: 'NIFTY IT', yahooSymbol: '%5ECNXIT' },
  { label: 'NIFTY AUTO', yahooSymbol: '%5ECNXAUTO' },
  { label: 'NIFTY PHARMA', yahooSymbol: '%5ECNXPHARMA' },
  { label: 'NIFTY FMCG', yahooSymbol: '%5ECNXFMCG' },
  { label: 'NIFTY METAL', yahooSymbol: '%5ECNXMETAL' },
  { label: 'NIFTY ENERGY', yahooSymbol: '%5ECNXENERGY' },
  { label: 'NIFTY REALTY', yahooSymbol: '%5ECNXREALTY' },
  { label: 'NIFTY PSU BANK', yahooSymbol: '%5ECNXPSUBANK' }
];

let cache: { data: SectorItem[]; ts: number } | null = null;
const CACHE_TTL_MS = 60000;

async function fetchOne(label: string, yahooSymbol: string): Promise<SectorItem | null> {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`, {
      next: { revalidate: 0 },
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MarketsDashboard/1.0)' }
    });
    if (!res.ok) return null;
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta || typeof meta.regularMarketPrice !== 'number') return null;
    const price = meta.regularMarketPrice;
    const prevClose = meta.previousClose ?? meta.chartPreviousClose ?? price;
    if (!prevClose) return null;
    return { label, changePct: ((price - prevClose) / prevClose) * 100 };
  } catch {
    return null;
  }
}

async function fetchAll(): Promise<SectorItem[]> {
  const settled = await Promise.all(SECTORS.map((s) => fetchOne(s.label, s.yahooSymbol)));
  const valid = settled.filter((s): s is SectorItem => s !== null);
  if (valid.length === 0) throw new Error('All sector index quotes failed');
  return valid.sort((a, b) => b.changePct - a.changePct);
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
