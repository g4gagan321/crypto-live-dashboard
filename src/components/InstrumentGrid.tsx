'use client';

import { useQuotes } from '@/hooks/useQuotes';
import { useNseQuotes } from '@/hooks/useNseQuotes';
import { useCryptoData } from '@/hooks/useCryptoData';
import { usePriceHistory, usePriceFlash } from '@/hooks/usePriceMotion';
import { ChangeBadge, AreaSpark, StaleDot } from '@/components/common/ui';
import type { QuoteItem } from '@/types';

/**
 * A single slim row of the 8 headline instruments — deliberately compact
 * (this used to be a half-screen 4x2 grid; the main body below now carries
 * the heatmap / breadth / movers panels, so this row's only job is "what's
 * the number right now", at a glance, across the full width). Nifty 50 /
 * Bank Nifty / India VIX come from /api/nse-quotes (AngelOne SmartAPI when
 * configured, Yahoo fallback otherwise). Gold / Silver / Crude / USD-INR
 * come from /api/quotes (Yahoo). Bitcoin comes from /api/crypto (CoinGecko).
 */
export function InstrumentGrid() {
  const { data: quotes, isStale: quotesStale } = useQuotes();
  const { data: nseQuotes, isStale: nseStale } = useNseQuotes();
  const { data: coins, isStale: coinsStale } = useCryptoData();

  const byId = (list: QuoteItem[] | null, id: string): QuoteItem | undefined => list?.find((q) => q.id === id);
  const btc = coins?.find((c) => c.id === 'bitcoin');

  return (
    <div className="grid h-full grid-cols-8 gap-2">
      <Tile label="NIFTY 50" quote={byId(nseQuotes, 'nifty50')} stale={nseStale} />
      <Tile label="BANK NIFTY" quote={byId(nseQuotes, 'banknifty')} stale={nseStale} />
      <Tile label="INDIA VIX" quote={byId(nseQuotes, 'indiavix')} stale={nseStale} />
      <Tile label="USD / INR" quote={byId(quotes, 'usdinr')} stale={quotesStale} />
      <Tile label="GOLD ($/oz)" quote={byId(quotes, 'gold')} stale={quotesStale} />
      <Tile label="SILVER ($/oz)" quote={byId(quotes, 'silver')} stale={quotesStale} />
      <Tile label="CRUDE WTI ($/bbl)" quote={byId(quotes, 'crude')} stale={quotesStale} />
      <BitcoinTile price={btc?.currentPrice} changePct={btc?.change24hPct} stale={coinsStale} loading={!btc} />
    </div>
  );
}

function Tile({ label, quote, stale }: { label: string; quote?: QuoteItem; stale: boolean }) {
  const unavailable = quote?.source === 'unavailable';
  const price = !unavailable ? quote?.price : undefined;
  const history = usePriceHistory(price);
  const flash = usePriceFlash(price);
  const positive = (quote?.changePct ?? 0) >= 0;

  return (
    <div
      className={`relative flex h-full items-center overflow-hidden rounded panel-border bg-terminal-panel px-2.5 ${
        flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : ''
      }`}
    >
      {quote && !unavailable && (
        <div className="absolute inset-y-1 right-1 w-[42%]">
          <AreaSpark points={history} positive={positive} />
        </div>
      )}

      <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-center gap-0.5 leading-none">
        <div className="flex items-center gap-1">
          <span className="truncate font-mono text-[9px] tracking-widest text-terminal-dim">{label}</span>
          <StaleDot visible={stale} />
        </div>
        {!quote ? (
          <span className="font-mono text-xs text-terminal-dim">Loading...</span>
        ) : unavailable ? (
          <span className="font-mono text-[10px] text-terminal-amber">Feed unavailable</span>
        ) : (
          <>
            <span className="mono-nums truncate font-mono text-base font-black leading-none text-terminal-text">
              {formatQuote(quote)}
            </span>
            <ChangeBadge value={quote.changePct} />
          </>
        )}
      </div>
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
  const positive = (changePct ?? 0) >= 0;

  return (
    <div
      className={`relative flex h-full items-center overflow-hidden rounded panel-border bg-terminal-panel px-2.5 ${
        flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : ''
      }`}
    >
      {!loading && price !== undefined && (
        <div className="absolute inset-y-1 right-1 w-[42%]">
          <AreaSpark points={history} positive={positive} />
        </div>
      )}

      <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-center gap-0.5 leading-none">
        <span className="font-mono text-[9px] tracking-widest text-terminal-dim">BITCOIN ($)</span>
        {loading || price === undefined ? (
          <span className="font-mono text-xs text-terminal-dim">Loading...</span>
        ) : (
          <>
            <span className="mono-nums truncate font-mono text-base font-black leading-none text-terminal-text">
              ${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
            <ChangeBadge value={changePct ?? 0} />
          </>
        )}
      </div>
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
