// Formatting helpers shared across every panel. Keeping number formatting
// centralized avoids subtle mismatches (e.g. one widget showing $1.2K,
// another showing $1,200) during a live broadcast.

export function formatUsd(value: number, opts: { compact?: boolean; decimals?: number } = {}): string {
  if (!Number.isFinite(value)) return '--';
  const { compact = false, decimals } = opts;
  if (compact) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 2
    }).format(value);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals ?? (value < 10 ? 4 : 2),
    maximumFractionDigits: decimals ?? (value < 10 ? 4 : 2)
  }).format(value);
}

export function formatPct(value: number): string {
  if (!Number.isFinite(value)) return '--';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) return '--';
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value);
}

export function timeAgo(timestampMs: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - timestampMs) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

export function formatClock(date: Date | null, timeZone?: string): string {
  if (!date) return '--:--:--';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
}

/**
 * NSE moved single-stock/index weekly derivatives expiry to Tuesday
 * (effective 1 Sept 2025, SEBI-mandated one-weekly-expiry-per-exchange
 * rule). Computes the next Tuesday 15:30 IST, rolling over automatically —
 * doesn't account for exchange holidays (expiry shifts to the prior
 * trading day when Tuesday is a holiday), which is a known simplification.
 */
export function getNextNseWeeklyExpiryIso(now: Date = new Date()): string {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  // Shift the epoch by the IST offset, then read it with UTC getters — this
  // yields IST wall-clock components regardless of the host machine's own
  // timezone, since we're operating on the absolute epoch, not local time.
  const shifted = new Date(now.getTime() + IST_OFFSET_MS);
  const day = shifted.getUTCDay(); // 0 Sun ... 2 Tue ... 6 Sat, in IST terms
  const hour = shifted.getUTCHours();
  const minute = shifted.getUTCMinutes();

  let daysUntilTue = (2 - day + 7) % 7;
  const pastCloseToday = day === 2 && (hour > 15 || (hour === 15 && minute >= 30));
  if (daysUntilTue === 0 && pastCloseToday) daysUntilTue = 7;

  const shiftedTargetMs = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate() + daysUntilTue,
    15,
    30,
    0
  );
  return new Date(shiftedTargetMs - IST_OFFSET_MS).toISOString();
}

export function formatCountdown(targetIso: string): { text: string; expired: boolean } {
  const target = new Date(targetIso).getTime();
  const diff = target - Date.now();
  if (diff <= 0) return { text: '00d 00h 00m 00s', expired: true };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return {
    text: `${String(days).padStart(2, '0')}d ${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`,
    expired: false
  };
}
