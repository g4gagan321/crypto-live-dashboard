'use client';

import { useMovers, useFiiDii, useSectors } from '@/hooks/useMarketPulse';
import { Panel } from '@/components/common/ui';
import type { MarketBreadth } from '@/app/api/movers/route';

/**
 * Left column: Market Breadth (real, computed from the Nifty 50 / Nifty 100
 * batches — labeled honestly, not a full-market NSE breadth figure, since
 * that needs a licensed feed), FII/DII net flows, and Nifty sector
 * performance bars (Yahoo NSE sector indices).
 *
 * There used to be a fourth panel here — a manually-configured Earnings
 * Calendar — but with no free, reliable live per-company results feed to
 * automate it, it sat empty most of the time. Dropped rather than kept as
 * a mostly-blank box; the freed space goes to Sector Performance.
 */
export function LeftColumn() {
  return (
    <div className="grid h-full grid-rows-[1fr_1fr_1.4fr] gap-1.5">
      <MarketBreadthPanel />
      <FiiDiiPanel />
      <SectorPanel />
    </div>
  );
}

function MarketBreadthPanel() {
  const { data: movers } = useMovers();

  return (
    <Panel title="MARKET BREADTH" className="min-h-0">
      <div className="grid h-full grid-cols-2 gap-1.5 px-3 py-2">
        <BreadthDonut label="NIFTY 50" breadth={movers?.breadth} />
        <BreadthDonut label="NIFTY 100" breadth={movers?.breadthNifty100} />
      </div>
    </Panel>
  );
}

function BreadthDonut({ label, breadth }: { label: string; breadth?: MarketBreadth }) {
  const total = breadth ? breadth.advances + breadth.declines + breadth.unchanged : 0;
  const advPct = breadth && total ? (breadth.advances / total) * 100 : 0;
  const decPct = breadth && total ? (breadth.declines / total) * 100 : 0;

  // Donut built from two stroke-dasharray arcs on a shared circle.
  const r = 30;
  const circumference = 2 * Math.PI * r;
  const advLen = (advPct / 100) * circumference;
  const decLen = (decPct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-mono text-[9px] tracking-widest text-terminal-dim">{label}</span>
      <svg viewBox="0 0 70 70" className="h-16 w-16 -rotate-90">
        <circle cx="35" cy="35" r={r} fill="none" stroke="#232b38" strokeWidth="9" />
        {breadth && (
          <>
            <circle
              cx="35"
              cy="35"
              r={r}
              fill="none"
              stroke="var(--brand-primary)"
              strokeWidth="9"
              strokeDasharray={`${advLen} ${circumference - advLen}`}
            />
            <circle
              cx="35"
              cy="35"
              r={r}
              fill="none"
              stroke="var(--brand-danger)"
              strokeWidth="9"
              strokeDasharray={`${decLen} ${circumference - decLen}`}
              strokeDashoffset={-advLen}
            />
          </>
        )}
      </svg>
      <div className="flex flex-col gap-0.5 font-mono text-[10px] leading-tight">
        <BreadthRow value={breadth?.advances} color="text-terminal-up" dotColor="bg-terminal-up" />
        <BreadthRow value={breadth?.declines} color="text-terminal-down" dotColor="bg-terminal-down" />
        <BreadthRow value={breadth?.unchanged} color="text-terminal-dim" dotColor="bg-terminal-dim" />
      </div>
    </div>
  );
}

function BreadthRow({ value, color, dotColor }: { value?: number; color: string; dotColor: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className={`h-1.5 w-1.5 flex-none rounded-full ${dotColor}`} />
      <span className={`font-bold ${color}`}>{value ?? '--'}</span>
    </div>
  );
}

function FiiDiiPanel() {
  const { data: fiiDii, isStale } = useFiiDii();
  const maxAbs = fiiDii ? Math.max(Math.abs(fiiDii.fiiNetCr), Math.abs(fiiDii.diiNetCr), 1) : 1;

  return (
    <Panel title="FII / DII (₹ CR, CASH MARKET)" className="min-h-0" right={isStale ? <StaleTag /> : undefined}>
      <div className="flex h-full flex-col justify-center gap-2 px-3 py-2 font-mono text-[11px]">
        <FlowBar label="FII" value={fiiDii?.fiiNetCr} maxAbs={maxAbs} />
        <FlowBar label="DII" value={fiiDii?.diiNetCr} maxAbs={maxAbs} />
        <FlowBar
          label="NET"
          value={fiiDii ? fiiDii.fiiNetCr + fiiDii.diiNetCr : undefined}
          maxAbs={maxAbs}
        />
      </div>
    </Panel>
  );
}

function FlowBar({ label, value, maxAbs }: { label: string; value?: number; maxAbs: number }) {
  const positive = (value ?? 0) >= 0;
  const widthPct = value !== undefined ? Math.min((Math.abs(value) / maxAbs) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 flex-none text-terminal-dim">{label}</span>
      <div className="relative h-3 flex-1 overflow-hidden rounded bg-terminal-bg">
        <div
          className={`h-full ${positive ? 'bg-terminal-up' : 'bg-terminal-down'}`}
          style={{ width: `${widthPct}%` }}
        />
      </div>
      <span className={`w-16 flex-none text-right font-bold ${positive ? 'text-terminal-up' : 'text-terminal-down'}`}>
        {value === undefined ? '--' : `${positive ? '+' : ''}${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
      </span>
    </div>
  );
}

function SectorPanel() {
  const { data: sectors } = useSectors();

  return (
    <Panel title="SECTOR PERFORMANCE (NIFTY)" className="min-h-0 overflow-hidden">
      <div className="flex h-full flex-col justify-center gap-1 overflow-hidden px-3 py-1.5 font-mono text-[10px]">
        {!sectors ? (
          <span className="text-terminal-dim">Loading...</span>
        ) : (
          sectors.slice(0, 8).map((s) => <SectorRow key={s.label} label={s.label} changePct={s.changePct} />)
        )}
      </div>
    </Panel>
  );
}

function SectorRow({ label, changePct }: { label: string; changePct: number }) {
  const positive = changePct >= 0;
  // Floor at 4% width so a genuinely tiny move (e.g. +0.06%) still shows as
  // a visible sliver instead of reading as "no bar at all" — the % label
  // next to it still carries the precise honest number.
  const widthPct = Math.max(Math.min(Math.abs(changePct) * 30, 100), 4);
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 flex-none truncate text-terminal-dim">{label}</span>
      <div className="relative h-2 flex-1 overflow-hidden rounded bg-terminal-bg">
        <div
          className={`h-full ${positive ? 'bg-terminal-up' : 'bg-terminal-down'}`}
          style={{ width: `${widthPct}%` }}
        />
      </div>
      <span className={`w-12 flex-none text-right font-bold ${positive ? 'text-terminal-up' : 'text-terminal-down'}`}>
        {positive ? '+' : ''}
        {changePct.toFixed(2)}%
      </span>
    </div>
  );
}

function StaleTag() {
  return <span className="font-mono text-[9px] text-terminal-amber">stale</span>;
}
