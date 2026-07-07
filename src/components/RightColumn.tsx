'use client';

import { useMovers } from '@/hooks/useMarketPulse';
import { useNseQuotes } from '@/hooks/useNseQuotes';
import { useNews } from '@/hooks/useNews';
import { Panel } from '@/components/common/ui';
import type { MoverItem } from '@/app/api/movers/route';

/**
 * Right column: ranked Top Gainers / Top Losers (real, Nifty 50 batch),
 * a real India VIX gauge (derived from the same AngelOne/Yahoo VIX value
 * already on screen up top — standard VIX bands, not invented), and a
 * static market-news headline list (the same feed as the bottom ticker,
 * just readable at a fixed glance instead of only scrolling by).
 */
export function RightColumn() {
  return (
    <div className="grid h-full grid-rows-[0.85fr_0.85fr_auto_1.8fr] gap-1.5">
      <MoversPanel />
      <MostActivePanel />
      <VixGaugePanel />
      <NewsPanel />
    </div>
  );
}

/** Gainers and losers side by side in one panel — was two full-height
 *  panels, which crowded out the News panel below. Same real Nifty 50
 *  batch, just laid out more compactly. */
function MoversPanel() {
  const { data: movers } = useMovers();
  const gainers: MoverItem[] = movers?.gainers ?? [];
  const losers: MoverItem[] = movers?.losers ?? [];

  return (
    <Panel title="TOP GAINERS / LOSERS" className="min-h-0 overflow-hidden" right={<span className="font-mono text-[9px] text-terminal-dim">NIFTY 50</span>}>
      <div className="grid h-full grid-cols-2 divide-x divide-terminal-border">
        <MoversList list={gainers} />
        <MoversList list={losers} />
      </div>
    </Panel>
  );
}

function MoversList({ list }: { list: MoverItem[] }) {
  return (
    <div className="flex h-full flex-col justify-center gap-1 px-2 py-1 font-mono text-[10px]">
      {list.length === 0 ? (
        <span className="px-1 text-terminal-dim">Loading...</span>
      ) : (
        list.map((m, i) => (
          <div key={m.symbol} className="flex items-center gap-1.5">
            <span className="w-3 flex-none text-terminal-dim">{i + 1}</span>
            <span className="flex-1 truncate font-bold text-terminal-text">{m.symbol}</span>
            <span className={`w-14 flex-none text-right font-bold ${m.changePct >= 0 ? 'text-terminal-up' : 'text-terminal-down'}`}>
              {m.changePct >= 0 ? '+' : ''}
              {m.changePct.toFixed(2)}%
            </span>
          </div>
        ))
      )}
    </div>
  );
}

/** Real "most active by traded value" (price × volume) from the same
 *  Nifty 50 batch fetch — fills the row freed up by combining
 *  gainers/losers, without inventing a separate options/IPO feed we
 *  can't back with a free, reliable live source. */
function MostActivePanel() {
  const { data: movers } = useMovers();
  const list: MoverItem[] = movers?.mostActive ?? [];

  return (
    <Panel title="MOST ACTIVE (BY VALUE)" className="min-h-0 overflow-hidden" right={<span className="font-mono text-[9px] text-terminal-dim">NIFTY 50</span>}>
      <div className="flex h-full flex-col justify-center gap-1 px-2 py-1 font-mono text-[11px]">
        {list.length === 0 ? (
          <span className="px-1 text-terminal-dim">Loading...</span>
        ) : (
          list.map((m, i) => (
            <div key={m.symbol} className="flex items-center gap-2">
              <span className="w-4 flex-none text-terminal-dim">{i + 1}</span>
              <span className="flex-1 truncate font-bold text-terminal-text">{m.symbol}</span>
              <span className="text-terminal-dim">{m.price ? m.price.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : ''}</span>
              <span className={`w-14 flex-none text-right font-bold ${m.changePct >= 0 ? 'text-terminal-up' : 'text-terminal-down'}`}>
                {m.changePct >= 0 ? '+' : ''}
                {m.changePct.toFixed(2)}%
              </span>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

function VixGaugePanel() {
  const { data: nseQuotes } = useNseQuotes();
  const vix = nseQuotes?.find((q) => q.id === 'indiavix');
  const value = vix && vix.source !== 'unavailable' ? vix.price : undefined;

  // Standard India VIX interpretation bands used across NSE commentary.
  const band =
    value === undefined ? null : value < 13 ? { label: 'LOW FEAR', color: 'text-terminal-up' } : value < 20 ? { label: 'MODERATE', color: 'text-terminal-amber' } : { label: 'HIGH FEAR', color: 'text-terminal-down' };

  // Gauge spans 0-40 (India VIX rarely exceeds ~40 outside crisis periods).
  const pct = value !== undefined ? Math.min(value / 40, 1) : 0;
  const angle = pct * 180;

  return (
    <Panel title="INDIA VIX GAUGE" className="min-h-0">
      <div className="flex h-full items-center justify-center gap-3 px-3 py-1">
        <svg viewBox="0 0 100 55" className="h-14 w-24 flex-none">
          <path d="M 5 50 A 45 45 0 0 1 95 50" fill="none" stroke="#232b38" strokeWidth="8" strokeLinecap="round" />
          <path
            d="M 5 50 A 45 45 0 0 1 95 50"
            fill="none"
            stroke={value === undefined ? '#232b38' : band?.color === 'text-terminal-up' ? 'var(--brand-primary)' : band?.color === 'text-terminal-amber' ? 'var(--brand-amber)' : 'var(--brand-danger)'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(angle / 180) * 141.4} 141.4`}
          />
        </svg>
        <div className="flex flex-col leading-tight">
          <span className="mono-nums font-mono text-xl font-black text-terminal-text">{value?.toFixed(2) ?? '--'}</span>
          <span className={`font-mono text-[10px] font-bold tracking-widest ${band?.color ?? 'text-terminal-dim'}`}>
            {band?.label ?? 'LOADING'}
          </span>
        </div>
      </div>
    </Panel>
  );
}

function NewsPanel() {
  const { data: news } = useNews();

  return (
    <Panel title="MARKET NEWS" className="min-h-0 overflow-hidden">
      <div className="flex h-full flex-col gap-2 overflow-hidden px-2.5 py-1.5 font-mono text-[11px]">
        {!news || news.length === 0 ? (
          <span className="text-terminal-dim">Loading headlines...</span>
        ) : (
          news.slice(0, 4).map((n) => (
            <div key={n.id} className="flex gap-2 leading-snug">
              <span className="flex-none text-terminal-dim">
                {new Date(n.publishedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </span>
              <span className="line-clamp-2 text-terminal-text">
                <span className="text-terminal-dim">{n.source.toUpperCase()}:</span> {n.title}
              </span>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}
