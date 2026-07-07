'use client';

import { useQuotes } from '@/hooks/useQuotes';
import { useNseQuotes } from '@/hooks/useNseQuotes';
import { useCryptoData } from '@/hooks/useCryptoData';
import { usePriceHistory, usePriceFlash } from '@/hooks/usePriceMotion';
import { ChangeBadge, Sparkline, StaleDot } from '@/components/common/ui';
import type { QuoteItem } from '@/types';

/**
 * The main broadcast surface: 8 big, readable live-price tiles. Nifty 50 /
 * Bank Nifty / India VIX come from /api/nse-quotes (AngelOne SmartAPI when
 * configured — real NSE data — falling back to a delayed Yahoo feed
 * otherwise). Gold / Silver / Crude / USD-INR come from /api/quotes
 * (Yahoo Finance, keyless). Bitcoin comes from /api/crypto (CoinGecko).
 * Each tile keeps a small rolling client-side price history for a
 * sparkline and flashes green/red on every tick, so the screen reads as
 * "alive" between the 10-15s server polls rather than a static number grid.
 */
export function InstrumentGrid() {
  const { data: quotes, isStale: quotesStale } = useQuotes();
  const { data: nseQuotes, isStale: nseStale } = useNseQuotes();
  const { data: coins, isStale: coinsStale } = useCryptoData();

  const byId = (list: QuoteItem[] | null, id: string): QuoteItem | undefined => list?.find((q) => q.id === id);
  const btc = coins?.find((c) => c.id === 'bitcoin');

  return (
    <div className="grid h-full grid-cols-4 grid-rows-2 gap-2">
      <Tile label="NIFTY 50" quote={byId(nseQuotes, 'nifty50')} stale={nseStale} />
      <Tile label="BANK NIFTY" quote={byId(nseQuotes, 'banknifty')} stale={nseStale} />
      <Tile label="INDIA VIX" quote={byId(nseQuotes, 'indiavix')} stale={nseStale} />
      <Tile label="USD / INR" quote={byId(quotes, 'usdinr')} stale={quotesStale} />
      <Tile label="GOLD ($/oz)" quote={byId(quotes, 'gold')} stale={quotesStale} />
      <Tile label="SILVER ($/oz)" quote={byId(quotes, 'silver')} stale={quotesStale} />
      <Tile label="CRUDE WTI ($/bbl)" quote={byId(quotes, 'crude')} stale={quotesStale} />
      <BitcoinTile
        price={btc?.currentPrice}
        changePct={btc?.change24hPct}
        stale={coinsStale}
        loading={!btc}
      />
    </div>
  );
}

function Tile({ label, quote, stale }: { label: string; quote?: QuoteItem; stale: boolean }) {
  const unavailable = quote?.source === 'unavailable';
  const price = !unavailable ? quote?.price : undefined;
  const history = usePriceHistory(price);
  const flash = usePriceFlash(price);

  return (
    <div
      className={`rounded panel-border bg-terminal-panel/80 p-3 flex flex-col justify-between ${
        flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : ''
      }`}
    >
      <span className="font-mono text-[10px] tracking-widest text-terminal-dim">{label}</span>
      {!quote ? (
        <span className="font-mono text-xs text-terminal-dim">Loading...</span>
      ) : unavailable ? (
        <span className="font-mono text-xs text-terminal-amber">Feed unavailable</span>
      ) : (
        <div className="flex flex-col gap-1">
          <span className="mono-nums font-mono text-2xl font-black text-terminal-text">{formatQuote(quote)}</span>
          <div className="flex items-center justify-between gap-2">
            <ChangeBadge value={quote.changePct} />
            <div className="w-16">
              <Sparkline points={history} positive={quote.changePct >= 0} />
            </div>
          </div>
        </div>
      )}
      <StaleDot visible={stale} />
    </div>
  );
}

function BitcoinTile({
  price,
  changePct,
  stale,
  loading
}: {
  price?: number;
  changePct?: number;
  stale: boolean;
  loading: boolean;
}) {
  const history = usePriceHistory(price);
  const flash = usePriceFlash(price);

  return (
    <div
      className={`rounded panel-border bg-terminal-panel/80 p-3 flex flex-col justify-between ${
        flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : ''
      }`}
    >
      <span className="font-mono text-[10px] tracking-widest text-terminal-dim">BITCOIN ($)</span>
      {loading || price === undefined ? (
        <span className="font-mono text-xs text-terminal-dim">Loading...</span>
      ) : (
        <div className="flex flex-col gap-1">
          <span className="mono-nums font-mono text-2xl font-black text-terminal-text">
            ${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
          <div className="flex items-center justify-between gap-2">
            <ChangeBadge value={changePct ?? 0} />
            <div className="w-16">
              <Sparkline points={history} positive={(changePct ?? 0) >= 0} />
            </div>
          </div>
        </div>
      )}
      <StaleDot visible={stale} />
    </div>
  );
}

function formatQuote(quote: QuoteItem): string {
  switch (quote.unit) {
    case 'usd':
      return `$${quote.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    case 'inr':
      return `₹${quote.price.toFixed(3)}`;
    case 'pct':
      return `${quote.price.toFixed(2)}%`;
    default:
      return quote.price.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
}
