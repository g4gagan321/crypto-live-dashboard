'use client';

import { usePolling } from './usePolling';
import { config } from '@/lib/config';
import type { QuoteItem } from '@/types';

export function useQuotes() {
  return usePolling<QuoteItem[]>('/api/quotes', { intervalMs: config.refreshIntervalsMs.quotes });
}
