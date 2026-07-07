'use client';

import { usePolling } from './usePolling';
import { config } from '@/lib/config';
import type { CoinPrice } from '@/types';

export function useCryptoData() {
  return usePolling<CoinPrice[]>('/api/crypto', {
    intervalMs: config.refreshIntervalsMs.cryptoPrices
  });
}
