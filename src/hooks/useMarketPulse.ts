'use client';

import { usePolling } from './usePolling';
import type { FiiDiiData } from '@/app/api/fiidii/route';
import type { MoversData } from '@/app/api/movers/route';
import type { SectorItem } from '@/app/api/sectors/route';
import type { GlobalMarketItem } from '@/app/api/global-markets/route';

export function useFiiDii() {
  return usePolling<FiiDiiData>('/api/fiidii', { intervalMs: 15 * 60 * 1000 });
}

export function useMovers() {
  return usePolling<MoversData>('/api/movers', { intervalMs: 60000 });
}

export function useSectors() {
  return usePolling<SectorItem[]>('/api/sectors', { intervalMs: 60000 });
}

export function useGlobalMarkets() {
  return usePolling<GlobalMarketItem[]>('/api/global-markets', { intervalMs: 30000 });
}
