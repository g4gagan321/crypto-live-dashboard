'use client';

import { useNews, useWhaleAlerts, useEtfFlows } from '@/hooks/useNews';
import { useCountdown } from '@/hooks/useCountdown';
import { config } from '@/lib/config';
import { formatUsd, formatCompactNumber } from '@/lib/format';

export function BottomBar() {
  const { data: news } = useNews();
  const { data: whales } = useWhaleAlerts(config.widgets.whaleAlerts);
  const { data: etfs } = useEtfFlows(config.widgets.etfFlows);

  const headlines = news?.length
    ? news.map((n) => `${n.source.toUpperCase()}: ${n.title}`)
    : ['Loading latest market headlines...'];

  const whaleHeadlines = whales?.length
    ? whales.map(
        (w) => `WHALE ALERT: ${formatCompactNumber(w.amountUsd)} ${w.symbol} moved ${w.from} -> ${w.to}${w.simulated ? ' (DEMO)' : ''}`
      )
    : [];

  const etfHeadlines = etfs?.length
    ? etfs.map((e) => `${e.fund} ETF NET FLOW: ${e.netFlowUsd >= 0 ? '+' : ''}${formatCompactNumber(e.netFlowUsd)}`)
    : [];

  const combined = [...headlines, ...etfHeadlines, ...whaleHeadlines];
  const tickerText = combined.join('     •     ');

  return (
    <div className="flex h-full items-stretch divide-x divide-terminal-border">
      <div className="flex flex-none items-center bg-terminal-danger px-3">
        <span className="font-mono text-xs font-black tracking-widest text-black">BREAKING</span>
      </div>

      <div className="relative flex-1 overflow-hidden bg-terminal-panel">
        <div className="absolute inset-y-0 flex items-center whitespace-nowrap font-mono text-sm text-terminal-text animate-ticker-scroll">
          <span className="pr-16">{tickerText}</span>
          <span className="pr-16">{tickerText}</span>
        </div>
      </div>

      <div className="flex flex-none items-center gap-6 bg-terminal-panel px-4">
        <CountdownChip label="US CPI" isoDate={config.economicEvents.usCpiNext} />
        <CountdownChip label="FOMC" isoDate={config.economicEvents.fomcNext} />
        <CountdownChip label="BTC HALVING" isoDate={config.economicEvents.bitcoinHalvingNext} />
      </div>
    </div>
  );
}

function CountdownChip({ label, isoDate }: { label: string; isoDate: string }) {
  const { text, expired } = useCountdown(isoDate);
  return (
    <div className="flex flex-col items-center leading-none">
      <span className="font-mono text-[9px] tracking-widest text-terminal-dim">{label}</span>
      <span className={`mono-nums font-mono text-xs font-bold ${expired ? 'text-terminal-up' : 'text-terminal-amber'}`}>
        {text}
      </span>
    </div>
  );
}
