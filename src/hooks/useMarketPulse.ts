'use client';

import { usePolling } from './usePolling';
import type { FiiDiiData } from '@/app/api/fiidii/route';
import type { MoversData } from '@/app/api/movers/route';

export function useFiiDii() {
  return usePolling<FiiDiiData>('/api/fiidii', { intervalMs: 15 * 60 * 1000 });
}

export function useMovers() {
  return usePolling<MoversData>('/api/movers', { intervalMs: 60000 });
}
