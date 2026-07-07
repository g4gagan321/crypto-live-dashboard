import { NextResponse } from 'next/server';
import type { FxData } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

let cache: { data: FxData; ts: number } | null = null;
const CACHE_TTL_MS = 20000;

// USD/INR spot rate. exchangerate.host is free and keyless; Frankfurter.app
// (ECB-sourced) is used as an automatic fallback if the primary is down.
// Note: these are reference/interbank rates, not tradable NSE currency
// futures ticks — fine for an on-screen "USD/INR" reference number on a
// broadcast, but not for trading decisions.
async function fetchFromExchangerateHost(): Promise<number> {
  const res = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=INR', {
    next: { revalidate: 0 }
  });
  if (!res.ok) throw new Error(`exchangerate.host failed: ${res.status}`);
  const json = await res.json();
  const rate = json?.rates?.INR;
  if (!rate) throw new Error('exchangerate.host response missing INR rate');
  return Number(rate);
}

async function fetchFromFrankfurter(): Promise<number> {
  const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR', { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`frankfurter.app failed: ${res.status}`);
  const json = await res.json();
  const rate = json?.rates?.INR;
  if (!rate) throw new Error('frankfurter.app response missing INR rate');
  return Number(rate);
}

export async function GET() {
  try {
    if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
      return NextResponse.json(cache.data);
    }
    let rate: number;
    try {
      rate = await fetchFromExchangerateHost();
    } catch {
      rate = await fetchFromFrankfurter();
    }
    const data: FxData = { pair: 'USD/INR', rate, asOf: Date.now() };
    cache = { data, ts: Date.now() };
    return NextResponse.json(data);
  } catch (err) {
    if (cache) return NextResponse.json(cache.data, { headers: { 'X-Data-Stale': 'true' } });
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 502 });
  }
}
