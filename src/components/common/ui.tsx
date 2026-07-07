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
    <div className={`panel-border flex flex-col rounded bg-terminal-panel/80 ${className}`}>
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
