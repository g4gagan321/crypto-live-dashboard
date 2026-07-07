import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export interface FiiDiiData {
  date: string;
  fiiNetCr: number;
  diiNetCr: number;
}

let cache: { data: FiiDiiData; ts: number } | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000; // this figure only updates once/day after market close

// NSE publishes daily provisional FII/DII cash-market activity on its own
// site. There's no formal public REST API for this — nseindia.com requires
// a browser-like session (cookies from a homepage visit) before its
// internal API endpoints respond, which is the same handshake community
// scraping tools (nsepython, jugaad-data) use. This is best-effort: NSE can
// change this endpoint or block server IPs (including some cloud/Vercel
// ranges) without notice, so failures fall back to the last-known-good
// cached figure rather than breaking the tile.
async function fetchFiiDii(): Promise<FiiDiiData> {
  const homepage = await fetch('https://www.nseindia.com/', {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      Accept: 'text/html'
    },
    next: { revalidate: 0 }
  });
  const cookies = homepage.headers.get('set-cookie') ?? '';

  const res = await fetch('https://www.nseindia.com/api/fiidiiTradeReact', {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      Accept: 'application/json',
      Referer: 'https://www.nseindia.com/',
      Cookie: cookies
    },
    next: { revalidate: 0 }
  });
  if (!res.ok) throw new Error(`NSE FII/DII request failed: ${res.status}`);
  const json = await res.json();
  // Response is an array with the most recent date first, each entry
  // shaped like { category: "FII/FPI" | "DII", date, buyValue, sellValue, netValue }.
  const fii = json.find((r: any) => /FII|FPI/i.test(r.category));
  const dii = json.find((r: any) => /DII/i.test(r.category));
  if (!fii || !dii) throw new Error('NSE FII/DII response missing expected categories');
  return {
    date: fii.date,
    fiiNetCr: Number(fii.netValue),
    diiNetCr: Number(dii.netValue)
  };
}

export async function GET() {
  try {
    if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
      return NextResponse.json(cache.data);
    }
    const data = await fetchFiiDii();
    cache = { data, ts: Date.now() };
    return NextResponse.json(data);
  } catch (err) {
    if (cache) return NextResponse.json(cache.data, { headers: { 'X-Data-Stale': 'true' } });
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 502 });
  }
}
