'use client';

import { usePolling } from './usePolling';
import { config } from '@/lib/config';
import type { FxData } from '@/types';

export function useFx() {
  return usePolling<FxData>('/api/fx', { intervalMs: config.refreshIntervalsMs.fx });
}
