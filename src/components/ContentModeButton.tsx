'use client';

import { useState } from 'react';
import { useMovers, useFiiDii, useSectors } from '@/hooks/useMarketPulse';
import { useNseQuotes } from '@/hooks/useNseQuotes';
import { useObsModeContext } from '@/components/ObsModeProvider';
import type { QuoteItem } from '@/types';
import type { MoversData } from '@/app/api/movers/route';
import type { FiiDiiData } from '@/app/api/fiidii/route';
import type { SectorItem } from '@/app/api/sectors/route';

/**
 * A streamer-only control — hidden whenever OBS Mode is on, exactly like
 * the OBS Mode toggle itself, so it never shows up in the broadcast
 * capture. Composes a ready-to-post one-liner from numbers already on
 * screen (Nifty/Bank Nifty move, top sector, FII/DII net, biggest single
 * mover) for pasting into an X post or YouTube community update between
 * segments — this is the "content mode" idea, scoped to what's actually
 * useful for a solo streamer rather than a full separate app surface.
 */
export function ContentModeButton() {
  const { obsMode } = useObsModeContext();
  const { data: nseQuotes } = useNseQuotes();
  const { data: movers } = useMovers();
  const { data: fiiDii } = useFiiDii();
  const { data: sectors } = useSectors();
  const [copied, setCopied] = useState(false);

  if (obsMode) return null;

  const handleCopy = async () => {
    const text = buildSummary({ nseQuotes, movers, fiiDii, sectors });
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can silently fail outside a user gesture / on non-https;
      // no on-screen data depends on this, so just don't flip the "copied" state.
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="fixed right-2 top-9 z-50 rounded border border-terminal-border bg-terminal-panel/90 px-2 py-1 font-mono text-[10px] tracking-widest text-terminal-dim hover:text-terminal-text"
    >
      {copied ? 'COPIED!' : 'COPY MARKET SUMMARY'}
    </button>
  );
}

function buildSummary({
  nseQuotes,
  movers,
  fiiDii,
  sectors
}: {
  nseQuotes: QuoteItem[] | null;
  movers: MoversData | null;
  fiiDii: FiiDiiData | null;
  sectors: SectorItem[] | null;
}): string {
  const parts: string[] = [];

  const nifty = nseQuotes?.find((q) => q.id === 'nifty50');
  if (nifty && nifty.source !== 'unavailable') {
    parts.push(`NIFTY 50 ${nifty.changePct >= 0 ? '+' : ''}${nifty.changePct.toFixed(2)}%`);
  }

  const bankNifty = nseQuotes?.find((q) => q.id === 'banknifty');
  if (bankNifty && bankNifty.source !== 'unavailable') {
    parts.push(`BANK NIFTY ${bankNifty.changePct >= 0 ? '+' : ''}${bankNifty.changePct.toFixed(2)}%`);
  }

  const topSector = sectors?.[0];
  if (topSector) {
    parts.push(`Top sector: ${topSector.label} ${topSector.changePct >= 0 ? '+' : ''}${topSector.changePct.toFixed(2)}%`);
  }

  if (fiiDii) {
    parts.push(
      `FII ${fiiDii.fiiNetCr >= 0 ? '+' : ''}${fiiDii.fiiNetCr.toLocaleString('en-IN')} cr, DII ${
        fiiDii.diiNetCr >= 0 ? '+' : ''
      }${fiiDii.diiNetCr.toLocaleString('en-IN')} cr`
    );
  }

  const topMover = movers?.all?.length
    ? [...movers.all].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))[0]
    : undefined;
  if (topMover) {
    parts.push(`Biggest mover: ${topMover.symbol} ${topMover.changePct >= 0 ? '+' : ''}${topMover.changePct.toFixed(2)}%`);
  }

  const timeStr = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata'
  });

  return parts.length ? `Market Pulse (${timeStr} IST): ${parts.join(' | ')}` : `Market Pulse (${timeStr} IST): data still loading`;
}
