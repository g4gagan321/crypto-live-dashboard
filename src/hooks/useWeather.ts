'use client';

import { usePolling } from './usePolling';

export interface WeatherData {
  city: string;
  tempC: number;
  condition: string;
}

export function useWeather() {
  return usePolling<WeatherData>('/api/weather', { intervalMs: 10 * 60 * 1000 });
}
