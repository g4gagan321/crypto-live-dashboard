'use client';

import { usePolling } from './usePolling';
import { config } from '@/lib/config';
import type { GlobalMarketData } from '@/types';

export function useGlobalData() {
  return usePolling<GlobalMarketData>('/api/global', {
    intervalMs: config.refreshIntervalsMs.globalMarket
  });
}
