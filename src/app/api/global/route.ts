import { NextResponse } from 'next/server';
import type { GlobalMarketData } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

let cache: { data: GlobalMarketData; ts: number } | null = null;
const CACHE_TTL_MS = 30000;

async function fetchGlobal(): Promise<GlobalMarketData> {
  const key = process.env.COINGECKO_API_KEY;
  const base = key ? 'https://pro-api.coingecko.com/api/v3' : 'https://api.coingecko.com/api/v3';
  const res = await fetch(`${base}/global${key ? `?x_cg_pro_api_key=${key}` : ''}`, {
    next: { revalidate: 0 }
  });
  if (!res.ok) throw new Error(`CoinGecko global request failed: ${res.status}`);
  const json = await res.json();
  const d = json.data;
  return {
    totalMarketCapUsd: d.total_market_cap.usd,
    totalVolume24hUsd: d.total_volume.usd,
    btcDominancePct: d.market_cap_percentage.btc,
    ethDominancePct: d.market_cap_percentage.eth,
    marketCapChange24hPct: d.market_cap_change_percentage_24h_usd
  };
}

export async function GET() {
  try {
    if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
      return NextResponse.json(cache.data);
    }
    const data = await fetchGlobal();
    cache = { data, ts: Date.now() };
    return NextResponse.json(data);
  } catch (err) {
    if (cache) return NextResponse.json(cache.data, { headers: { 'X-Data-Stale': 'true' } });
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 502 });
  }
}
