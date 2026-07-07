'use client';

import { useEffect, useState } from 'react';

/**
 * Ticks once per second. Returns `null` until the first client-side effect
 * runs, then real Date objects after that.
 *
 * Why: `useState(new Date())` evaluates immediately during render, both on
 * the server and again during the client's first render pass. Those two
 * evaluations happen at genuinely different instants (network round-trip,
 * hydration delay), so the seconds digit can differ — producing exactly the
 * "server: 12:48:05 / client: 12:48:06" hydration mismatch. Starting at
 * `null` guarantees the server-rendered markup and the client's first
 * render match exactly; the real clock only kicks in from useEffect, which
 * never runs during SSR.
 */
export function useClock(intervalMs = 1000): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
