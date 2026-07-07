'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Keeps a rolling buffer of the last N prices for a tile, purely client-side
 * (no extra network calls) — feeds the little sparkline so the screen shows
 * motion between polls instead of a static number that only changes every
 * 15 seconds.
 */
export function usePriceHistory(price: number | undefined, maxPoints = 24): number[] {
  const [history, setHistory] = useState<number[]>([]);
  const lastPrice = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (price === undefined || price === lastPrice.current) return;
    lastPrice.current = price;
    setHistory((prev) => [...prev, price].slice(-maxPoints));
  }, [price, maxPoints]);

  return history;
}

/**
 * Returns 'up' | 'down' | null for a brief window right after the price
 * changes, so the tile can flash green/red — the classic trading-terminal
 * "tick" cue that makes a screen feel live even when the underlying data
 * only refreshes every few seconds.
 */
export function usePriceFlash(price: number | undefined, durationMs = 700): 'up' | 'down' | null {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const lastPrice = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (price === undefined) return;
    if (lastPrice.current !== undefined && price !== lastPrice.current) {
      setFlash(price > lastPrice.current ? 'up' : 'down');
      const id = setTimeout(() => setFlash(null), durationMs);
      lastPrice.current = price;
      return () => clearTimeout(id);
    }
    lastPrice.current = price;
  }, [price, durationMs]);

  return flash;
}
