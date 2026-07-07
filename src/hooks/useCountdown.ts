'use client';

import { useEffect, useState } from 'react';
import { formatCountdown } from '@/lib/format';

export function useCountdown(targetIso: string) {
  const [value, setValue] = useState(() => formatCountdown(targetIso));

  useEffect(() => {
    const id = setInterval(() => setValue(formatCountdown(targetIso)), 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  return value;
}
