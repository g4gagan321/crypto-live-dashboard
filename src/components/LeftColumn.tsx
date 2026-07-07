'use client';

import { useMovers, useFiiDii, useSectors } from '@/hooks/useMarketPulse';
import { Panel } from '@/components/common/ui';

/**
 * Left column: Market Breadth (real, computed from the same Nifty 50 batch
 * that feeds the heatmap — labeled honestly as a Nifty 50 reading, not a
 * full-market NSE breadth figure, since that needs a licensed feed), FII/DII
 * net flows, and Nifty sector performance bars (Yahoo NSE sector indices).
 */
export function LeftColumn() {
  return (
    <div className="grid h-full grid-rows-3 gap-2">
      <MarketBreadthPanel />
      <FiiDiiPanel />
      <SectorPanel />
    </div>
  );
}

function MarketBreadthPanel() {
  const { data: movers } = useMovers();
  const breadth = movers?.breadth;
  const total = breadth ? breadth.advances + breadth.declines + breadth.unchanged : 0;
  const advPct = breadth && total ? (breadth.advances / total) * 100 : 0;
  const decPct = breadth && total ? (breadth.declines / total) * 100 : 0;

  // Donut built from two stroke-dasharray arcs on a shared circle.
  const r = 34;
  const circumference = 2 * Math.PI * r;
  const advLen = (advPct / 100) * circumference;
  const decLen = (decPct / 100) * circumference;

  return (
    <Panel title="MARKET BREADTH (NIFTY 50)" className="min-h-0">
      <div className="flex h-full items-center gap-3 px-3 py-2">
        <svg viewBox="0 0 80 80" className="h-full max-h-20 w-20 flex-none -rotate-90">
          <circle cx="40" cy="40" r={r} fill="none" stroke="#e2e4e9" strokeWidth="10" />
          {breadth && (
            <>
              <circle
                cx="40"
                cy="40"
                r={r}
                fill="none"
                stroke="var(--brand-primary)"
                strokeWidth="10"
                strokeDasharray={`${advLen} ${circumference - advLen}`}
              />
              <circle
                cx="40"
                cy="40"
                r={r}
                fill="none"
                stroke="var(--brand-danger)"
                strokeWidth="10"
                strokeDasharray={`${decLen} ${circumference - decLen}`}
                strokeDashoffset={-advLen}
              />
            </>
          )}
        </svg>
        <div className="flex flex-1 flex-col gap-1 font-mono text-[11px]">
          <BreadthRow label="ADVANCES" value={breadth?.advances} color="text-terminal-up" dotColor="bg-terminal-up" />
          <BreadthRow label="DECLINES" value={breadth?.declines} color="text-terminal-down" dotColor="bg-terminal-down" />
          <BreadthRow label="UNCHANGED" value={breadth?.unchanged} color="text-terminal-dim" dotColor="bg-terminal-dim" />
        </div>
      </div>
    </Panel>
  );
}

function BreadthRow({
  label,
  value,
  color,
  dotColor
}: {
  label: string;
  value?: number;
  color: string;
  dotColor: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2 w-2 flex-none rounded-full ${dotColor}`} />
      <span className="flex-1 text-terminal-dim">{label}</span>
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
  const widthPct = Math.min(Math.abs(changePct) * 20, 100);
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
