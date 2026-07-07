'use client';

import { usePolling } from './usePolling';
import { config } from '@/lib/config';
import type { FearGreedData } from '@/types';

export function useFearGreed() {
  return usePolling<FearGreedData>('/api/fng', {
    intervalMs: config.refreshIntervalsMs.fearGreed
  });
}
