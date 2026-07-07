import { NextResponse } from 'next/server';
import { getIndexQuotes, isAngelOneConfigured } from '@/lib/angelone';
import type { QuoteItem } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

let cache: { data: QuoteItem[]; ts: number } | null = null;
const CACHE_TTL_MS = 10000;

const LABELS: Record<string, string> = {
  nifty50: 'NIFTY 50',
  banknifty: 'BANK NIFTY',
  indiavix: 'INDIA VIX'
};

// Yahoo fallback for Nifty 50 / Bank Nifty only — Yahoo has no India VIX
// symbol, so that tile shows "unavailable" rather than a wrong number if
// AngelOne isn't configured.
async function fetchYahooFallback(): Promise<QuoteItem[]> {
  const symbols: { id: string; yahooSymbol: string }[] = [
    { id: 'nifty50', yahooSymbol: '%5ENSEI' },
    { id: 'banknifty', yahooSymbol: '%5ENSEBANK' }
  ];
  const settled = await Promise.allSettled(
    symbols.map(async (s): Promise<QuoteItem> => {
      const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${s.yahooSymbol}?interval=1d&range=1d`, {
        next: { revalidate: 0 },
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MarketsDashboard/1.0)' }
      });
      if (!res.ok) throw new Error(`Yahoo fallback failed for ${s.id}`);
      const json = await res.json();
      const meta = json?.chart?.result?.[0]?.meta;
      if (!meta) throw new Error(`Yahoo fallback missing meta for ${s.id}`);
      const price = meta.regularMarketPrice;
      const prevClose = meta.previousClose ?? meta.chartPreviousClose ?? price;
      const changePct = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;
      return { id: s.id, label: LABELS[s.id]!, price, changePct, unit: 'index', source: 'yahoo' };
    })
  );
  const items: QuoteItem[] = settled
    .filter((r): r is PromiseFulfilledResult<QuoteItem> => r.status === 'fulfilled')
    .map((r) => r.value);
  items.push({ id: 'indiavix', label: LABELS.indiavix!, price: 0, changePct: 0, unit: 'index', source: 'unavailable' });
  return items;
}

async function fetchAll(): Promise<{ items: QuoteItem[]; angelOneStatus: string }> {
  if (!isAngelOneConfigured()) {
    console.error('[AngelOne] Not configured — one or more of ANGELONE_API_KEY / ANGELONE_CLIENT_CODE / ANGELONE_PASSWORD / ANGELONE_TOTP_SECRET is missing in this environment.');
    return { items: await fetchYahooFallback(), angelOneStatus: 'not-configured' };
  }
  try {
    const quotes = await getIndexQuotes();
    const items: QuoteItem[] = Object.entries(quotes).map(([id, q]) => ({
      id,
      label: LABELS[id] ?? id,
      price: q.ltp,
      changePct: q.changePct,
      unit: 'index',
      source: 'yahoo' // reusing the "trusted numeric feed" contract; not literally Yahoo
    }));
    // Fill in any index AngelOne didn't return (e.g. a token mismatch) so the UI never silently drops a tile.
    for (const id of Object.keys(LABELS)) {
      if (!items.find((i) => i.id === id)) {
        items.push({ id, label: LABELS[id]!, price: 0, changePct: 0, unit: 'index', source: 'unavailable' });
      }
    }
    return { items, angelOneStatus: 'ok' };
  } catch (err) {
    // Logged (not swallowed) so Vercel's runtime logs show exactly why AngelOne
    // fell back to Yahoo — auth failures, bad TOTP, network errors, etc.
    console.error('[AngelOne] Quote fetch failed, falling back to Yahoo:', err instanceof Error ? err.message : err);
    return { items: await fetchYahooFallback(), angelOneStatus: `error: ${err instanceof Error ? err.message : 'unknown'}` };
  }
}

export async function GET() {
  try {
    if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
      return NextResponse.json(cache.data);
    }
    const { items, angelOneStatus } = await fetchAll();
    cache = { data: items, ts: Date.now() };
    return NextResponse.json(items, { headers: { 'X-AngelOne-Status': angelOneStatus } });
  } catch (err) {
    if (cache) return NextResponse.json(cache.data, { headers: { 'X-Data-Stale': 'true' } });
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 502 });
  }
}
