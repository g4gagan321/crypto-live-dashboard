import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export interface MoverItem {
  symbol: string;
  changePct: number;
  price?: number;
}

export interface MarketBreadth {
  advances: number;
  declines: number;
  unchanged: number;
}

export interface MoversData {
  gainers: MoverItem[];
  losers: MoverItem[];
  /** All 49 constituents we could fetch, for the heatmap grid. */
  all: MoverItem[];
  /** Real counts computed from this same Nifty 50 batch — not full-market
   *  NSE breadth (that needs a licensed feed), but an honest, live number. */
  breadth: MarketBreadth;
}

// Nifty 50 constituents (index composition changes periodically — NSE
// reshuffles it twice a year, so re-check this list occasionally against
// https://www.niftyindices.com/indices/equity/broad-based-indices/nifty-50).
// Pulled via Yahoo Finance's keyless chart endpoint, same as /api/quotes.
const NIFTY50_CONSTITUENTS = [
  'ADANIENT', 'ADANIPORTS', 'APOLLOHOSP', 'ASIANPAINT', 'AXISBANK', 'BAJAJ-AUTO', 'BAJFINANCE',
  'BAJAJFINSV', 'BEL', 'BHARTIARTL', 'CIPLA', 'COALINDIA', 'DRREDDY', 'EICHERMOT', 'GRASIM',
  'HCLTECH', 'HDFCBANK', 'HDFCLIFE', 'HEROMOTOCO', 'HINDALCO', 'HINDUNILVR', 'ICICIBANK', 'ITC',
  'INDUSINDBK', 'INFY', 'JSWSTEEL', 'KOTAKBANK', 'LT', 'M&M', 'MARUTI', 'NESTLEIND', 'NTPC',
  'ONGC', 'POWERGRID', 'RELIANCE', 'SBILIFE', 'SHRIRAMFIN', 'SBIN', 'SUNPHARMA', 'TCS',
  'TATACONSUM', 'TATAMOTORS', 'TATASTEEL', 'TECHM', 'TITAN', 'TRENT', 'ULTRACEMCO', 'WIPRO', 'LTIM'
];

let cache: { data: MoversData; ts: number } | null = null;
const CACHE_TTL_MS = 60000;

async function fetchOne(symbol: string): Promise<MoverItem | null> {
  try {
    const yahooSymbol = encodeURIComponent(`${symbol}.NS`);
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
    const changePct = ((price - prevClose) / prevClose) * 100;
    return { symbol, changePct, price };
  } catch {
    return null;
  }
}

async function fetchAll(): Promise<MoversData> {
  const settled = await Promise.all(NIFTY50_CONSTITUENTS.map(fetchOne));
  const valid = settled.filter((m): m is MoverItem => m !== null);
  if (valid.length === 0) throw new Error('All Nifty 50 constituent quotes failed');
  const sorted = [...valid].sort((a, b) => b.changePct - a.changePct);

  // Real breadth computed from this same batch. Flat threshold of 0.03% avoids
  // labeling normal quote-to-quote noise as "unchanged" vs a genuine flat print.
  const breadth = valid.reduce(
    (acc, m) => {
      if (m.changePct > 0.03) acc.advances += 1;
      else if (m.changePct < -0.03) acc.declines += 1;
      else acc.unchanged += 1;
      return acc;
    },
    { advances: 0, declines: 0, unchanged: 0 }
  );

  return {
    gainers: sorted.slice(0, 5),
    losers: sorted.slice(-5).reverse(),
    all: valid,
    breadth
  };
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
