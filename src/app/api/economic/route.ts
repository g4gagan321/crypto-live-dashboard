import { NextResponse } from 'next/server';
import { config } from '@/lib/config';
import type { EconomicEvent } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// A full real-time economic calendar (Forex Factory / Trading Economics) sits
// behind paid APIs or scraping ToS restrictions. We instead surface the
// specific high-impact events the brief calls out, configured in
// config/dashboard.config.json so they can be updated without a code change,
// plus a short list of recurring macro events for the strip.
export async function GET() {
  const events: EconomicEvent[] = [
    { id: 'cpi', title: 'US CPI Release', date: config.economicEvents.usCpiNext, impact: 'high' },
    { id: 'fomc', title: 'FOMC Rate Decision', date: config.economicEvents.fomcNext, impact: 'high' },
    { id: 'halving', title: 'Bitcoin Halving', date: config.economicEvents.bitcoinHalvingNext, impact: 'medium' }
  ];
  return NextResponse.json(events);
}
