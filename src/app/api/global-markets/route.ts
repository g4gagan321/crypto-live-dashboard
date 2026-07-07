import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export interface GlobalMarketItem {
  label: string;
  changePct: number;
  price: number;
  unit: 'index' | 'pct' | 'usd';
}

// Global benchmarks via Yahoo's keyless chart endpoint. WTI Crude and Gold/
// Silver already live in /api/quotes, so they're deliberately not repeated
// here (the brief specifically calls out not to duplicate the same figure
// across two panels).
const SYMBOLS: { label: string; yahooSymbol: string; unit: GlobalMarketItem['unit'] }[] = [
  { label: 'DOW JONES', yahooSymbol: '%5EDJI', unit: 'index' },
  { label: 'NASDAQ', yahooSymbol: '%5EIXIC', unit: 'index' },
  { label: 'S&P 500', yahooSymbol: '%5EGSPC', unit: 'index' },
  { label: 'FTSE 100', yahooSymbol: '%5EFTSE', unit: 'index' },
  { label: 'DAX', yahooSymbol: '%5EGDAXI', unit: 'index' },
  { label: 'CAC 40', yahooSymbol: '%5EFCHI', unit: 'index' },
  { label: 'NIKKEI 225', yahooSymbol: '%5EN225', unit: 'index' },
  { label: 'HANG SENG', yahooSymbol: '%5EHSI', unit: 'index' },
  { label: 'SHANGHAI', yahooSymbol: '000001.SS', unit: 'index' },
  { label: 'US 10Y YIELD', yahooSymbol: '%5ETNX', unit: 'pct' },
  { label: 'DOLLAR INDEX', yahooSymbol: 'DX-Y.NYB', unit: 'index' },
  { label: 'BRENT CRUDE', yahooSymbol: 'BZ%3DF', unit: 'usd' },
  { label: 'COPPER', yahooSymbol: 'HG%3DF', unit: 'usd' },
  { label: 'NATURAL GAS', yahooSymbol: 'NG%3DF', unit: 'usd' }
];

let cache: { data: GlobalMarketItem[]; ts: number } | null = null;
const CACHE_TTL_MS = 30000;

async function fetchOne(s: (typeof SYMBOLS)[number]): Promise<GlobalMarketItem | null> {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${s.yahooSymbol}?interval=1d&range=1d`, {
      next: { revalidate: 0 },
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MarketsDashboard/1.0)' }
    });
    if (!res.ok) return null;
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta || typeof meta.regularMarketPrice !== 'number') return null;
    const price = meta.regularMarketPrice;
    const prevClose = meta.previousClose ?? meta.chartPreviousClose ?? price;
    const changePct = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;
    // ^TNX is quoted x10 (e.g. 42.8 => 4.28%)
    const displayPrice = s.label === 'US 10Y YIELD' ? price / 10 : price;
    return { label: s.label, changePct, price: displayPrice, unit: s.unit };
  } catch {
    return null;
  }
}

async function fetchAll(): Promise<GlobalMarketItem[]> {
  const settled = await Promise.all(SYMBOLS.map(fetchOne));
  const valid = settled.filter((s): s is GlobalMarketItem => s !== null);
  if (valid.length === 0) throw new Error('All global market quotes failed');
  return valid;
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
