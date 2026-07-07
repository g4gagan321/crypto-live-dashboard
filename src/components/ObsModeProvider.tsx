'use client';

import { createContext, useContext } from 'react';
import { useObsMode } from '@/hooks/useObsMode';

interface ObsModeContextValue {
  obsMode: boolean;
  toggleObsMode: () => void;
}

const ObsModeContext = createContext<ObsModeContextValue | null>(null);

export function ObsModeProvider({ children }: { children: React.ReactNode }) {
  const { obsMode, toggleObsMode } = useObsMode();
  return <ObsModeContext.Provider value={{ obsMode, toggleObsMode }}>{children}</ObsModeContext.Provider>;
}

export function useObsModeContext() {
  const ctx = useContext(ObsModeContext);
  if (!ctx) throw new Error('useObsModeContext must be used within ObsModeProvider');
  return ctx;
}

/** Small floating control, top-right, that itself disappears while OBS Mode is on. */
export function ObsModeToggle() {
  const { obsMode, toggleObsMode } = useObsModeContext();
  if (obsMode) return null;
  return (
    <button
      onClick={toggleObsMode}
      className="fixed right-2 top-2 z-50 rounded border border-terminal-border bg-terminal-panel/90 px-2 py-1 font-mono text-[10px] tracking-widest text-terminal-dim hover:text-terminal-text"
    >
      ENABLE OBS MODE
    </button>
  );
}
