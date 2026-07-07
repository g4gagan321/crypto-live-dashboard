'use client';

import { useGlobalMarkets } from '@/hooks/useMarketPulse';

/**
 * A slim strip of global benchmarks (Dow, Nasdaq, S&P, FTSE, DAX, CAC,
 * Nikkei, Hang Seng, Shanghai, US 10Y, Dollar Index, Brent, Copper, Nat
 * Gas). Any symbol Yahoo doesn't resolve is simply absent from the list
 * rather than shown as a placeholder.
 */
export function GlobalMarketsRow() {
  const { data: markets, isStale } = useGlobalMarkets();

  return (
    <div className="flex h-full items-center gap-4 overflow-hidden bg-terminal-panel px-3 font-mono text-xs">
      <span className="flex-none font-bold tracking-widest text-terminal-text">GLOBAL MARKETS</span>
      {isStale && <span className="flex-none text-terminal-amber">stale</span>}
      <div className="flex min-w-0 flex-1 items-center gap-4 overflow-hidden whitespace-nowrap">
        {!markets ? (
          <span className="text-terminal-dim">loading...</span>
        ) : (
          markets.map((m) => (
            <span key={m.label} className="flex-none">
              <span className="font-bold text-terminal-text">{m.label}</span>{' '}
              <span className="mono-nums font-bold text-terminal-text">
                {m.unit === 'pct' ? `${m.price.toFixed(2)}%` : m.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </span>{' '}
              <span className={`font-bold ${m.changePct >= 0 ? 'text-terminal-up' : 'text-terminal-down'}`}>
                {m.changePct >= 0 ? '+' : ''}
                {m.changePct.toFixed(2)}%
              </span>
            </span>
          ))
        )}
      </div>
    </div>
  );
}
