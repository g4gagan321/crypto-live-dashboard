'use client';

import { usePolling } from './usePolling';
import { config } from '@/lib/config';
import type { QuoteItem } from '@/types';

export function useNseQuotes() {
  return usePolling<QuoteItem[]>('/api/nse-quotes', { intervalMs: config.refreshIntervalsMs.quotes });
}
