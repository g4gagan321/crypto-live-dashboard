'use client';

import { useClock } from '@/hooks/useClock';
import { useWeather } from '@/hooks/useWeather';
import { formatClock } from '@/lib/format';
import { config } from '@/lib/config';

/**
 * Slim strip: world clocks + weather. The instrument prices themselves
 * live in the main InstrumentGrid (fed by our own /api/quotes + /api/crypto
 * routes) rather than a TradingView ticker tape — NSE-licensed symbols
 * (Nifty/Bank Nifty/GIFT Nifty/India VIX) render blank in TradingView's
 * anonymous ticker-tape embed, so duplicating them here added no value.
 */
export function ExtrasStrip() {
  return (
    <div className="flex h-full items-center justify-end divide-x divide-terminal-border bg-terminal-panel px-2">
      <WeatherBlock />
      <WorldClocks />
    </div>
  );
}

function WeatherBlock() {
  const { data } = useWeather();
  return (
    <div className="flex flex-none items-center gap-2 px-3 font-mono text-xs text-terminal-text">
      <span className="text-terminal-dim">{data?.city ?? '--'}</span>
      <span className="font-bold">{data ? `${data.tempC}°C` : '--'}</span>
      <span className="text-terminal-dim">{data?.condition ?? ''}</span>
    </div>
  );
}

function WorldClocks() {
  const now = useClock(1000);
  return (
    <div className="flex flex-none items-center gap-4 px-3">
      {config.worldClocks.map((wc) => (
        <div key={wc.timeZone + wc.label} className="flex flex-col items-center leading-none">
          <span className="font-mono text-[8px] tracking-widest text-terminal-dim">{wc.label}</span>
          <span className="mono-nums font-mono text-[11px] font-bold text-terminal-text">
            {formatClock(now, wc.timeZone)}
          </span>
        </div>
      ))}
    </div>
  );
}
