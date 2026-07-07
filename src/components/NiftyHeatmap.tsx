'use client';

import { useMovers } from '@/hooks/useMarketPulse';
import { Panel } from '@/components/common/ui';

/**
 * The centerpiece panel: every Nifty 50 constituent we could fetch, laid
 * out as a color-intensity grid — the biggest, most-glanced-at element on
 * screen, same role a heatmap/treemap plays on CNBC or Moneycontrol.
 *
 * This is a uniform-cell heatmap rather than a market-cap-weighted
 * treemap: we don't have a free, reliable live market-cap feed to size
 * boxes by honestly, and guessing at relative company size would mean
 * showing something that looks precise but isn't. Every cell's color
 * intensity is real (driven by that stock's actual %-change), just not
 * its size.
 */
export function NiftyHeatmap() {
  const { data: movers } = useMovers();
  const stocks = movers?.all ? [...movers.all].sort((a, b) => a.symbol.localeCompare(b.symbol)) : null;

  return (
    <Panel title="NIFTY 50 HEATMAP" className="h-full">
      {!stocks ? (
        <div className="flex h-full items-center justify-center font-mono text-xs text-terminal-dim">
          Loading constituents...
        </div>
      ) : (
        <div className="grid h-full auto-rows-fr grid-cols-7 gap-1 p-1.5">
          {stocks.map((s) => (
            <HeatCell key={s.symbol} symbol={s.symbol} changePct={s.changePct} price={s.price} />
          ))}
        </div>
      )}
    </Panel>
  );
}

function HeatCell({ symbol, changePct, price }: { symbol: string; changePct: number; price?: number }) {
  const positive = changePct >= 0;
  // Scale color intensity so a small move looks pale and a big move looks saturated;
  // real Nifty 50 single-stock moves rarely exceed ~5% intraday, so that's the ceiling.
  const intensity = Math.min(Math.abs(changePct) / 5, 1);
  const bg = positive ? `rgba(10, 143, 78, ${0.18 + intensity * 0.72})` : `rgba(216, 31, 61, ${0.18 + intensity * 0.72})`;
  const lightText = intensity > 0.35;

  return (
    <div
      className="flex flex-col items-center justify-center rounded-sm px-1 text-center leading-tight"
      style={{ backgroundColor: bg }}
      title={price ? `${symbol}: ₹${price.toLocaleString('en-IN')}` : symbol}
    >
      <span className={`truncate text-[11px] font-bold ${lightText ? 'text-white' : 'text-terminal-text'}`}>
        {symbol}
      </span>
      <span className={`mono-nums text-[10px] font-semibold ${lightText ? 'text-white' : 'text-terminal-text'}`}>
        {positive ? '+' : ''}
        {changePct.toFixed(2)}%
      </span>
    </div>
  );
}
