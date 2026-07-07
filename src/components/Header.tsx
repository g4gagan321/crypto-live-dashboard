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
        <BrandMark />
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

/**
 * Super Compound's channel mark, rebuilt as inline SVG (mic capsule + arc
 * stand, gold accent) since the source PNG the channel provided isn't
 * reachable as a file from this environment — only the config-driven
 * brand.logoUrl path would be, if one is ever supplied. If you'd rather use
 * the exact original artwork, drop the PNG into public/logo.png in the repo
 * and set config/dashboard.config.json -> brand.logoUrl to "/logo.png";
 * Header will need a one-line swap to <img src={config.brand.logoUrl} />
 * instead of this SVG.
 */
function BrandMark() {
  if (config.brand.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- tiny fixed-size
    // header mark; not worth Next/Image's overhead for a 36px icon.
    return <img src={config.brand.logoUrl} alt={config.brand.name} className="h-9 w-9 flex-none rounded object-contain" />;
  }
  return (
    <div className="flex h-9 w-9 flex-none items-center justify-center rounded bg-terminal-bg">
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
        <rect x="9" y="2" width="6" height="10" rx="3" fill="var(--brand-amber)" />
        <circle cx="12" cy="5.5" r="0.9" fill="#090b10" />
        <path
          d="M6 11a6 6 0 0 0 12 0"
          stroke="var(--brand-amber)"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        />
        <line x1="12" y1="17" x2="12" y2="20.5" stroke="var(--brand-amber)" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="8.5" y1="20.5" x2="15.5" y2="20.5" stroke="var(--brand-amber)" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </div>
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
