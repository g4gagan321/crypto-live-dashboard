import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export interface MoverItem {
  symbol: string;
  changePct: number;
  price?: number;
  /** Regular-session traded volume (shares), from the same Yahoo quote —
   *  used to derive a real "most active by value" list, not an invented one. */
  volume?: number;
}

export interface MarketBreadth {
  advances: number;
  declines: number;
  unchanged: number;
}

export interface MoversData {
  gainers: MoverItem[];
  losers: MoverItem[];
  /** All 49 Nifty 50 constituents we could fetch, for the heatmap grid. */
  all: MoverItem[];
  /** Real counts computed from the Nifty 50 batch — not full-market NSE
   *  breadth (that needs a licensed feed), but an honest, live number. */
  breadth: MarketBreadth;
  /** Same real-count approach, but across Nifty 50 + Nifty Next 50 (~100
   *  large/mid caps) as a broader-than-just-top-50 proxy. Still not true
   *  whole-market (~2000 stock) breadth — NSE doesn't publish that for free
   *  in a way we can hit reliably from a serverless deploy — so this is
   *  labeled "NIFTY 100" in the UI, not "Total Market". */
  breadthNifty100: MarketBreadth;
  /** Top 5 Nifty 50 names by traded value (price × volume) today — real,
   *  computed from the same batch fetch, not a separate/fabricated feed. */
  mostActive: MoverItem[];
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

// Nifty Next 50 (approximate — same reconstitution caveat as above; check
// against https://www.niftyindices.com/indices/equity/broad-based-indices/nifty-next-50
// occasionally). Combined with NIFTY50_CONSTITUENTS this is the "Nifty 100"
// breadth proxy — still ~100 of NSE's ~2000 listed stocks, not the whole tape.
const NIFTY_NEXT_50_CONSTITUENTS = [
  'ABB', 'ADANIENSOL', 'ADANIGREEN', 'ADANIPOWER', 'AMBUJACEM', 'BAJAJHLDNG', 'BANKBARODA',
  'BERGEPAINT', 'BOSCHLTD', 'CANBK', 'CHOLAFIN', 'COLPAL', 'DABUR', 'DIVISLAB', 'DLF', 'GAIL',
  'GICRE', 'GODREJCP', 'HAVELLS', 'HAL', 'ICICIGI', 'ICICIPRULI', 'IOC', 'INDIGO', 'IRFC',
  'JINDALSTEL', 'JIOFIN', 'LODHA', 'LUPIN', 'MARICO', 'MOTHERSON', 'NHPC', 'NAUKRI', 'PIDILITIND',
  'PIIND', 'PFC', 'PGHH', 'PNB', 'POLYCAB', 'RECLTD', 'SIEMENS', 'SRF', 'SHREECEM', 'TATAPOWER',
  'TORNTPHARM', 'TVSMOTOR', 'UNITDSPR', 'VBL', 'VEDL', 'ZOMATO', 'ZYDUSLIFE'
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
    const volume: number | undefined = typeof meta.regularMarketVolume === 'number' ? meta.regularMarketVolume : undefined;
    return { symbol, changePct, price, volume };
  } catch {
    return null;
  }
}

function computeBreadth(items: MoverItem[]): MarketBreadth {
  // Flat threshold of 0.03% avoids labeling normal quote-to-quote noise as
  // "unchanged" vs a genuine flat print.
  return items.reduce(
    (acc, m) => {
      if (m.changePct > 0.03) acc.advances += 1;
      else if (m.changePct < -0.03) acc.declines += 1;
      else acc.unchanged += 1;
      return acc;
    },
    { advances: 0, declines: 0, unchanged: 0 }
  );
}

async function fetchAll(): Promise<MoversData> {
  const [settled50, settledNext50] = await Promise.all([
    Promise.all(NIFTY50_CONSTITUENTS.map(fetchOne)),
    Promise.all(NIFTY_NEXT_50_CONSTITUENTS.map(fetchOne))
  ]);
  const valid50 = settled50.filter((m): m is MoverItem => m !== null);
  const validNext50 = settledNext50.filter((m): m is MoverItem => m !== null);
  if (valid50.length === 0) throw new Error('All Nifty 50 constituent quotes failed');
  const sorted = [...valid50].sort((a, b) => b.changePct - a.changePct);
  const byValue = [...valid50]
    .filter((m) => typeof m.volume === 'number' && typeof m.price === 'number')
    .sort((a, b) => (b.price! * b.volume!) - (a.price! * a.volume!));

  return {
    gainers: sorted.slice(0, 5),
    losers: sorted.slice(-5).reverse(),
    all: valid50,
    breadth: computeBreadth(valid50),
    breadthNifty100: computeBreadth([...valid50, ...validNext50]),
    mostActive: byValue.slice(0, 5)
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
