'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'obsModeEnabled';

/**
 * OBS Mode toggles a body class (`obs-mode`) that CSS in globals.css uses to:
 *  - hide the mouse cursor
 *  - disable hover/tooltip affordances
 *  - hide scrollbars
 * Persisted in localStorage so it survives reloads of the OBS Browser Source.
 * Also supports the URL query param `?obs=1` for one-shot setup without clicking.
 */
export function useObsMode(): { obsMode: boolean; toggleObsMode: () => void; setObsMode: (v: boolean) => void } {
  const [obsMode, setObsModeState] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('obs');
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const initial = fromQuery === '1' ? true : fromQuery === '0' ? false : stored === 'true';
    setObsModeState(initial);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('obs-mode', obsMode);
    window.localStorage.setItem(STORAGE_KEY, String(obsMode));
  }, [obsMode]);

  const toggleObsMode = useCallback(() => setObsModeState((v) => !v), []);
  const setObsMode = useCallback((v: boolean) => setObsModeState(v), []);

  return { obsMode, toggleObsMode, setObsMode };
}
