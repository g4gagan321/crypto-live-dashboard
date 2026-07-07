'use client';

import { usePolling } from './usePolling';
import { config } from '@/lib/config';
import type { NewsItem, WhaleAlertItem, EtfFlowItem } from '@/types';

export function useNews() {
  return usePolling<NewsItem[]>('/api/news', {
    intervalMs: config.refreshIntervalsMs.news
  });
}

export function useWhaleAlerts(enabled = true) {
  return usePolling<WhaleAlertItem[]>('/api/whales', {
    intervalMs: config.refreshIntervalsMs.whaleAlerts,
    enabled
  });
}

export function useEtfFlows(enabled = true) {
  return usePolling<EtfFlowItem[]>('/api/whales?type=etf', {
    intervalMs: config.refreshIntervalsMs.whaleAlerts,
    enabled
  });
}
