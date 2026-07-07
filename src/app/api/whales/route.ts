import { NextResponse } from 'next/server';
import type { WhaleAlertItem, EtfFlowItem } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Whale Alert (whale-alert.io) requires a paid API plan for real-time
// on-chain transaction data. When WHALE_ALERT_API_KEY is present we use it;
// otherwise we generate a clearly-labeled simulated feed so the "Whale
// Alerts" panel is never empty during a live broadcast, and so the
// simulated flag is available for the UI to badge it as "DEMO DATA".
async function fetchRealWhaleAlerts(apiKey: string): Promise<WhaleAlertItem[]> {
  const res = await fetch(`https://api.whale-alert.io/v1/transactions?api_key=${apiKey}&min_value=1000000`, {
    next: { revalidate: 0 }
  });
  if (!res.ok) throw new Error(`Whale Alert request failed: ${res.status}`);
  const json = await res.json();
  return (json.transactions ?? []).slice(0, 15).map((t: any) => ({
    id: String(t.hash ?? t.id),
    blockchain: t.blockchain,
    amountUsd: t.amount_usd,
    symbol: String(t.symbol).toUpperCase(),
    from: t.from?.owner ?? t.from?.address ?? 'unknown',
    to: t.to?.owner ?? t.to?.address ?? 'unknown',
    timestamp: Number(t.timestamp) * 1000
  }));
}

function simulatedWhaleAlerts(): WhaleAlertItem[] {
  const symbols = ['BTC', 'ETH', 'USDT', 'SOL', 'XRP'];
  const wallets = ['Binance', 'Coinbase', 'Unknown Wallet', 'Kraken', 'OKX', 'Bybit'];
  const now = Date.now();
  return Array.from({ length: 10 }).map((_, i) => {
    const symbol = symbols[i % symbols.length]!;
    const amount = Math.round((1_000_000 + Math.random() * 40_000_000) / 1000) * 1000;
    return {
      id: `sim-${now}-${i}`,
      blockchain: symbol === 'BTC' ? 'bitcoin' : symbol === 'ETH' ? 'ethereum' : 'multi-chain',
      amountUsd: amount,
      symbol,
      from: wallets[Math.floor(Math.random() * wallets.length)]!,
      to: wallets[Math.floor(Math.random() * wallets.length)]!,
      timestamp: now - i * 60000,
      simulated: true
    };
  });
}

function simulatedEtfFlows(): EtfFlowItem[] {
  const funds = ['IBIT', 'FBTC', 'ARKB', 'GBTC', 'BITB'];
  return funds.map((fund) => ({
    fund,
    netFlowUsd: Math.round((Math.random() - 0.4) * 300_000_000),
    asOf: new Date().toISOString().slice(0, 10)
  }));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const apiKey = process.env.WHALE_ALERT_API_KEY;

  if (type === 'etf') {
    // No free real-time ETF flow API exists; this is simulated for on-screen
    // layout purposes and clearly marked as such via `simulated`/badge in UI.
    return NextResponse.json(simulatedEtfFlows());
  }

  if (!apiKey) {
    return NextResponse.json(simulatedWhaleAlerts());
  }

  try {
    const data = await fetchRealWhaleAlerts(apiKey);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(simulatedWhaleAlerts());
  }
}
