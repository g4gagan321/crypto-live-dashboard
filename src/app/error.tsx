'use client';

import { useEffect } from 'react';

// Next.js route-level error boundary. Auto-recovers after a short delay so
// an unattended 24/7 broadcast never gets stuck on a crashed screen.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[Dashboard] Uncaught render error:', error);
    const id = setTimeout(() => reset(), 5000);
    return () => clearTimeout(id);
  }, [error, reset]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-terminal-bg text-terminal-text">
      <p className="font-mono text-sm text-terminal-dim">DASHBOARD RECOVERING — RETRYING IN 5s</p>
    </div>
  );
}
