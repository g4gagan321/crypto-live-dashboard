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
    <div className="flex h-full items-center gap-4 overflow-hidden bg-terminal-panel px-3 font-mono text-[11px]">
      <div className="flex flex-none flex-col justify-center leading-tight">
        <span className="tracking-widest text-terminal-dim">FII/DII (₹ CR)</span>
        {fiiDii ? (
          <div className="flex items-center gap-3">
            <FlowFigure label="FII" value={fiiDii.fiiNetCr} />
            <FlowFigure label="DII" value={fiiDii.diiNetCr} />
            {fiiDiiStale && <span className="text-terminal-amber">stale</span>}
          </div>
        ) : (
          <span className="text-terminal-dim">loading...</span>
        )}
      </div>

      <div className="h-8 w-px bg-terminal-border" />

      <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
        <span className="flex-none tracking-widest text-terminal-dim">NIFTY 50 MOVERS</span>
        {movers ? (
          <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
            {movers.gainers.map((m) => (
              <HeatChip key={m.symbol} symbol={m.symbol} changePct={m.changePct} />
            ))}
            <div className="mx-1 h-6 w-px flex-none bg-terminal-border" />
            {movers.losers.map((m) => (
              <HeatChip key={m.symbol} symbol={m.symbol} changePct={m.changePct} />
            ))}
          </div>
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

/**
 * A single heatmap-style cell: solid, intensity-scaled green/red block with
 * the stock symbol and % move. Gives the "Nifty 50 movers" readout the same
 * at-a-glance color signal as a CNBC/Moneycontrol sector heatmap, without
 * needing a full 50-tile grid that would compete for space with the main
 * instrument tiles.
 */
function HeatChip({ symbol, changePct }: { symbol: string; changePct: number }) {
  const positive = changePct >= 0;
  // Scale intensity so a +/-0.5% move looks pale and a +/-3%+ move looks saturated.
  const intensity = Math.min(Math.abs(changePct) / 3, 1);
  const bg = positive
    ? `rgba(10, 143, 78, ${0.12 + intensity * 0.35})`
    : `rgba(216, 31, 61, ${0.12 + intensity * 0.35})`;
  const fg = positive ? 'text-terminal-up' : 'text-terminal-down';

  return (
    <div
      className="flex flex-none flex-col items-center justify-center rounded px-1.5 py-0.5 leading-tight"
      style={{ backgroundColor: bg }}
    >
      <span className="text-[9px] font-bold tracking-tight text-terminal-text">{symbol}</span>
      <span className={`text-[9px] font-bold ${fg}`}>
        {positive ? '+' : ''}
        {changePct.toFixed(2)}%
      </span>
    </div>
  );
}
