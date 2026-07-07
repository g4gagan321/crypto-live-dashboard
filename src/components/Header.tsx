'use client';

import { useClock } from '@/hooks/useClock';
import { formatClock } from '@/lib/format';
import { config } from '@/lib/config';
import { LiveBadge } from '@/components/common/ui';

function isCryptoMarketOpen(): { label: string; color: string } {
  // Crypto markets are always open, but we still show a status chip so the
  // header layout matches a traditional multi-asset terminal, and so the
  // Extras strip (equities/futures) can reuse the same component honestly.
  return { label: 'MARKET OPEN 24/7', color: 'text-terminal-up' };
}

export function Header() {
  const now = useClock(1000);
  const status = isCryptoMarketOpen();

  return (
    <header className="flex h-14 items-center justify-between border-b border-terminal-border bg-terminal-panel px-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded bg-[var(--brand-primary)] font-mono text-sm font-black text-black">
          {config.brand.logoText}
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-display text-sm font-bold tracking-wide text-terminal-text">{config.brand.name}</span>
          <span className="font-mono text-[10px] tracking-widest text-terminal-dim">{config.brand.tagline}</span>
        </div>
      </div>

      <div className="flex items-center gap-6 font-mono">
        <ClockChip label="UTC" time={formatClock(now, 'UTC')} />
        <ClockChip label="IST" time={formatClock(now, 'Asia/Kolkata')} />
        <div className={`text-xs font-bold tracking-widest ${status.color}`}>{status.label}</div>
        <LiveBadge />
      </div>
    </header>
  );
}

function ClockChip({ label, time }: { label: string; time: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[10px] tracking-widest text-terminal-dim">{label}</span>
      <span className="mono-nums text-sm font-bold text-terminal-text">{time}</span>
    </div>
  );
}
