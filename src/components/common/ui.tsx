import React from 'react';

export function Panel({
  title,
  children,
  className = '',
  right
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className={`panel-border flex flex-col rounded bg-terminal-panel ${className}`}>
      {title && (
        <div className="flex items-center justify-between border-b border-terminal-border px-3 py-1.5">
          <span className="font-mono text-[11px] font-semibold tracking-widest text-terminal-dim">{title}</span>
          {right}
        </div>
      )}
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

export function LiveBadge() {
  return (
    <div className="flex items-center gap-1.5 rounded bg-terminal-danger/10 px-2 py-1">
      <span className="live-dot h-2 w-2 animate-pulseLive rounded-full bg-terminal-danger" />
      <span className="font-mono text-xs font-bold tracking-widest text-terminal-danger">LIVE</span>
    </div>
  );
}

export function ChangeBadge({ value, size = 'sm' }: { value: number; size?: 'sm' | 'lg' }) {
  const positive = value >= 0;
  const textSize = size === 'lg' ? 'text-2xl' : 'text-xs';
  return (
    <span
      className={`font-mono font-bold ${textSize} mono-nums ${positive ? 'text-terminal-up' : 'text-terminal-down'}`}
    >
      {positive ? '+' : ''}
      {value.toFixed(2)}%
    </span>
  );
}

export function StaleDot({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return <span title="Showing last known good data" className="h-1.5 w-1.5 rounded-full bg-terminal-amber" />;
}

/** Tiny inline trend line built from a rolling client-side price buffer. */
export function Sparkline({ points, positive }: { points: number[]; positive: boolean }) {
  if (points.length < 2) return <div className="h-6 w-full" />;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 100;
  const h = 24;
  const step = w / (points.length - 1);
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i * step).toFixed(2)},${(h - ((p - min) / range) * h).toFixed(2)}`)
    .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-6 w-full">
      <path
        d={path}
        fill="none"
        stroke={positive ? 'var(--brand-primary)' : 'var(--brand-danger)'}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * A full-bleed filled area chart meant to occupy the entire body of a
 * price tile (not just a thin strip), so a tile with only a handful of
 * ticks still reads as "a live chart" rather than empty whitespace. Falls
 * back to a flat baseline while the rolling price buffer is still filling
 * up right after page load.
 */
export function AreaSpark({ points, positive }: { points: number[]; positive: boolean }) {
  const w = 100;
  const h = 40;
  const color = positive ? 'var(--brand-primary)' : 'var(--brand-danger)';
  const gradientId = `areaspark-${positive ? 'up' : 'down'}`;

  if (points.length < 2) {
    return (
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-full w-full">
        <line x1={0} y1={h - 1} x2={w} y2={h - 1} stroke={color} strokeOpacity={0.25} strokeWidth={1} />
      </svg>
    );
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = w / (points.length - 1);
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i * step).toFixed(2)},${(h - ((p - min) / range) * h).toFixed(2)}`)
    .join(' ');
  const areaPath = `${linePath} L ${w},${h} L 0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-full w-full">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
      <path d={linePath} fill="none" stroke={color} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
