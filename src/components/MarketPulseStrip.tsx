'use client';

import { useFiiDii, useMovers } from '@/hooks/useMarketPulse';

/**
 * A slim, single-row strip between the world-clock strip and the main
 * instrument grid: FII/DII net flows (the number Indian retail traders
 * check every morning) plus a compact Nifty 50 gainers/losers readout.
 * Deliberately thin — this is "more content" without turning the screen
 * into a cluttered spreadsheet.
 */
export function MarketPulseStrip() {
  const { data: fiiDii, isStale: fiiDiiStale } = useFiiDii();
  const { data: movers } = useMovers();

  return (
    <div className="flex h-full items-center gap-6 overflow-hidden bg-terminal-panel px-3 font-mono text-[11px]">
      <div className="flex flex-none items-center gap-3">
        <span className="tracking-widest text-terminal-dim">FII/DII (₹ CR)</span>
        {fiiDii ? (
          <>
            <FlowFigure label="FII" value={fiiDii.fiiNetCr} />
            <FlowFigure label="DII" value={fiiDii.diiNetCr} />
            <span className="text-terminal-dim">{fiiDiiStale ? '· stale' : ''}</span>
          </>
        ) : (
          <span className="text-terminal-dim">loading...</span>
        )}
      </div>

      <div className="h-4 w-px bg-terminal-border" />

      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden whitespace-nowrap">
        <span className="flex-none tracking-widest text-terminal-dim">NIFTY 50 MOVERS</span>
        {movers ? (
          <>
            {movers.gainers.map((m) => (
              <span key={m.symbol} className="text-terminal-up">
                {m.symbol} +{m.changePct.toFixed(2)}%
              </span>
            ))}
            <span className="text-terminal-border">|</span>
            {movers.losers.map((m) => (
              <span key={m.symbol} className="text-terminal-down">
                {m.symbol} {m.changePct.toFixed(2)}%
              </span>
            ))}
          </>
        ) : (
          <span className="text-terminal-dim">loading...</span>
        )}
      </div>
    </div>
  );
}

function FlowFigure({ label, value }: { label: string; value: number }) {
  const positive = value >= 0;
  return (
    <span className={positive ? 'text-terminal-up' : 'text-terminal-down'}>
      {label} {positive ? '+' : ''}
      {value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
    </span>
  );
}
