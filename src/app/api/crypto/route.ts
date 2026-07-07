import { NextResponse } from 'next/server';
import { config } from '@/lib/config';
import type { CoinPrice } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Server-side proxy to CoinGecko's /coins/markets endpoint.
// Kept server-side so:
//   1) the CoinGecko API key (if any) never reaches the browser
//   2) we can normalize the shape once for every widget that needs prices
async function fetchFromCoinGecko(): Promise<CoinPrice[]> {
  const ids = config.majorCoins.join(',');
  const key = process.env.COINGECKO_API_KEY;
  const base = key ? 'https://pro-api.coingecko.com/api/v3' : 'https://api.coingecko.com/api/v3';
  const url = `${base}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=true&price_change_percentage=24h${
    key ? `&x_cg_pro_api_key=${key}` : ''
  }`;

  const res = await fetch(url, { next: { revalidate: 0 }, headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`CoinGecko markets request failed: ${res.status}`);
  const json = await res.json();

  return (json as any[]).map((c) => ({
    id: c.id,
    symbol: String(c.symbol).toUpperCase(),
    name: c.name,
    image: c.image,
    currentPrice: c.current_price,
    change24hPct: c.price_change_percentage_24h ?? 0,
    volume24h: c.total_volume,
    marketCap: c.market_cap,
    sparkline: c.sparkline_in_7d?.price ?? []
  }));
}

// Small in-memory cache so bursts of concurrent client requests (e.g. multiple
// browser tabs, or a reconnect storm) don't multiply upstream API calls.
let cache: { data: CoinPrice[]; ts: number } | null = null;
const CACHE_TTL_MS = 10000;

export async function GET() {
  try {
    if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
      return NextResponse.json(cache.data);
    }
    const data = await fetchFromCoinGecko();
    cache = { data, ts: Date.now() };
    return NextResponse.json(data);
  } catch (err) {
    // Graceful degradation: serve last-known-good cache (marked via header)
    // rather than a hard failure, so the on-air widgets keep showing numbers.
    if (cache) {
      return NextResponse.json(cache.data, { headers: { 'X-Data-Stale': 'true' } });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 502 });
  }
}
