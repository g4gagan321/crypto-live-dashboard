// Central type definitions for the dashboard. Keeping these in one file
// makes it easy to see the full data contract between API routes and UI.

export interface CoinPrice {
  id: string;
  symbol: string;
  name: string;
  image: string;
  currentPrice: number;
  change24hPct: number;
  volume24h: number;
  marketCap: number;
  sparkline?: number[];
}

export interface GlobalMarketData {
  totalMarketCapUsd: number;
  totalVolume24hUsd: number;
  btcDominancePct: number;
  ethDominancePct: number;
  marketCapChange24hPct: number;
}

export interface FearGreedData {
  value: number;
  label: string;
  timestamp: number;
}

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: number;
}

export interface WhaleAlertItem {
  id: string;
  blockchain: string;
  amountUsd: number;
  symbol: string;
  from: string;
  to: string;
  timestamp: number;
  simulated?: boolean;
}

export interface EtfFlowItem {
  fund: string;
  netFlowUsd: number;
  asOf: string;
}

export interface FxData {
  pair: string;
  rate: number;
  asOf: number;
}

export interface QuoteItem {
  id: string;
  label: string;
  price: number;
  changePct: number;
  unit: 'usd' | 'inr' | 'pct' | 'index';
  source: 'yahoo' | 'unavailable';
}

export interface EconomicEvent {
  id: string;
  title: string;
  date: string;
  impact: 'low' | 'medium' | 'high';
}

export interface CountdownTarget {
  label: string;
  isoDate: string;
}

export interface DashboardConfig {
  brand: {
    name: string;
    tagline: string;
    logoText: string;
    logoUrl: string;
  };
  theme: {
    primaryColor: string;
    dangerColor: string;
    amberColor: string;
    backgroundColor: string;
    panelColor: string;
  };
  widgets: Record<string, boolean>;
  refreshIntervalsMs: {
    cryptoPrices: number;
    globalMarket: number;
    fearGreed: number;
    news: number;
    fx: number;
    quotes: number;
    whaleAlerts: number;
    economicEvents: number;
    clock: number;
  };
  majorCoins: string[];
  newsSources: { name: string; enabled: boolean; rssUrl?: string }[];
  economicEvents: {
    usCpiNext: string;
    fomcNext: string;
    bitcoinHalvingNext: string;
    rbiPolicyNext: string;
  };
  earningsCalendar?: { symbol: string; label: string; dateIso: string }[];
  worldClocks: { label: string; timeZone: string }[];
  obsMode: {
    hideCursor: boolean;
    disableTooltips: boolean;
    disableHoverEffects: boolean;
    disableAnimations: boolean;
    targetResolution: string;
  };
}

export type ApiResult<T> =
  | { ok: true; data: T; stale?: boolean }
  | { ok: false; error: string };
