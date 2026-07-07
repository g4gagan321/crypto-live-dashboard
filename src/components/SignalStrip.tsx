'use client';

import { useMovers, useFiiDii } from '@/hooks/useMarketPulse';
import { useNseQuotes } from '@/hooks/useNseQuotes';

/**
 * "What matters right now" — a single glanceable line synthesizing signals
 * that already live elsewhere on screen (VIX band, Nifty 50 breadth,
 * FII/DII net, the day's biggest single-stock move) into one composite
 * read, the way a desk note leads with "risk-on"/"risk-off" before the
 * detail. Purely derived from hooks the rest of the dashboard already
 * polls — no new data source, no new API calls.
 */
export function SignalStrip() {
  const { data: nseQuotes } = useNseQuotes();
  const { data: movers } = useMovers();
  const { data: fiiDii } = useFiiDii();

  const vix = nseQuotes?.find((q) => q.id === 'indiavix');
  const vixValue = vix && vix.source !== 'unavailable' ? vix.price : undefined;
  const vixBand = vixValue === undefined ? null : vixValue < 13 ? 'low' : vixValue < 20 ? 'moderate' : 'high';

  const breadth = movers?.breadth;
  const breadthTilt =
    breadth === undefined
      ? null
      : breadth.advances > breadth.declines * 1.15
        ? 'bullish'
        : breadth.declines > breadth.advances * 1.15
          ? 'bearish'
          : 'neutral';

  const fiiDiiNet = fiiDii ? fiiDii.fiiNetCr + fiiDii.diiNetCr : undefined;

  const topMover = movers?.all?.length
    ? [...movers.all].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))[0]
    : undefined;

  const regime =
    vixBand && breadthTilt
      ? vixBand !== 'high' && breadthTilt === 'bullish'
        ? { label: 'RISK-ON', color: 'text-terminal-up' }
        : vixBand === 'high' || breadthTilt === 'bearish'
          ? { label: 'RISK-OFF', color: 'text-terminal-down' }
          : { label: 'NEUTRAL', color: 'text-terminal-amber' }
      : null;

  return (
    <div className="flex h-full items-center gap-4 overflow-hidden rounded panel-border bg-terminal-panel px-3 font-mono text-[11px]">
      <span className="flex-none tracking-widest text-terminal-dim">MARKET PULSE</span>
      <Item label="REGIME" value={regime?.label ?? '--'} color={regime?.color} />
      <Divider />
      <Item
        label="VIX"
        value={vixValue !== undefined ? `${vixValue.toFixed(2)} (${vixBand?.toUpperCase()})` : '--'}
        color={vixBand === 'low' ? 'text-terminal-up' : vixBand === 'moderate' ? 'text-terminal-amber' : vixBand === 'high' ? 'text-terminal-down' : undefined}
      />
      <Divider />
      <Item
        label="BREADTH"
        value={breadth ? `${breadth.advances}A / ${breadth.declines}D (${breadthTilt?.toUpperCase()})` : '--'}
        color={breadthTilt === 'bullish' ? 'text-terminal-up' : breadthTilt === 'bearish' ? 'text-terminal-down' : undefined}
      />
      <Divider />
      <Item
        label="FII/DII NET"
        value={
          fiiDiiNet !== undefined
            ? `${fiiDiiNet >= 0 ? '+' : ''}${fiiDiiNet.toLocaleString('en-IN', { maximumFractionDigits: 0 })} CR`
            : '--'
        }
        color={fiiDiiNet !== undefined ? (fiiDiiNet >= 0 ? 'text-terminal-up' : 'text-terminal-down') : undefined}
      />
      <Divider />
      <Item
        label="BIGGEST MOVE"
        value={topMover ? `${topMover.symbol} ${topMover.changePct >= 0 ? '+' : ''}${topMover.changePct.toFixed(2)}%` : '--'}
        color={topMover ? (topMover.changePct >= 0 ? 'text-terminal-up' : 'text-terminal-down') : undefined}
      />
    </div>
  );
}

function Item({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <span className="flex-none">
      <span className="text-terminal-dim">{label}:</span>{' '}
      <span className={`font-bold ${color ?? 'text-terminal-text'}`}>{value}</span>
    </span>
  );
}

function Divider() {
  return <span className="h-4 w-px flex-none bg-terminal-border" />;
}
