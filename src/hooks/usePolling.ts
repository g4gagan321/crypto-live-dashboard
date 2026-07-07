'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { fetcher } from '@/lib/fetcher';

interface PollingOptions {
  intervalMs: number;
  enabled?: boolean;
  retryBackoffMs?: number;
  maxRetryBackoffMs?: number;
}

interface PollingState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  lastUpdated: number | null;
  isStale: boolean;
}

/**
 * Generic resilient polling hook. Designed for a dashboard that must run
 * for weeks unattended:
 *  - Uses setTimeout (not setInterval) so a slow request never overlaps the next.
 *  - Exponential backoff on failure, capped, then resets on success.
 *  - Never clears previously-good data on a transient failure (marks it "stale" instead),
 *    so the on-air screen never flashes empty/broken during a live stream.
 *  - Cleans up timers on unmount to avoid leaks across long sessions.
 */
export function usePolling<T>(url: string | null, { intervalMs, enabled = true, retryBackoffMs = 3000, maxRetryBackoffMs = 60000 }: PollingOptions): PollingState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [isStale, setIsStale] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failCountRef = useRef(0);
  const mountedRef = useRef(true);

  const tick = useCallback(async () => {
    if (!url || !enabled) return;
    try {
      const result = await fetcher<T>(url);
      if (!mountedRef.current) return;
      setData(result);
      setError(null);
      setIsStale(false);
      setLastUpdated(Date.now());
      failCountRef.current = 0;
      timeoutRef.current = setTimeout(tick, intervalMs);
    } catch (err) {
      if (!mountedRef.current) return;
      failCountRef.current += 1;
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsStale((prev) => prev || data !== null);
      const backoff = Math.min(retryBackoffMs * 2 ** (failCountRef.current - 1), maxRetryBackoffMs);
      timeoutRef.current = setTimeout(tick, backoff);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, enabled, intervalMs, retryBackoffMs, maxRetryBackoffMs]);

  useEffect(() => {
    mountedRef.current = true;
    if (url && enabled) {
      setIsLoading(true);
      tick();
    }
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, enabled]);

  return { data, error, isLoading, lastUpdated, isStale };
}
