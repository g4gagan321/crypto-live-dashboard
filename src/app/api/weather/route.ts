import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// OpenWeather when a key is configured; otherwise falls back to Open-Meteo,
// which is entirely free and keyless (New York coordinates as default).
export async function GET() {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const city = process.env.OPENWEATHER_CITY || 'Mumbai,IN';

  try {
    if (apiKey) {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`,
        { next: { revalidate: 0 } }
      );
      if (!res.ok) throw new Error('OpenWeather request failed');
      const json = await res.json();
      return NextResponse.json({
        city: json.name,
        tempC: Math.round(json.main.temp),
        condition: json.weather?.[0]?.main ?? 'N/A'
      });
    }

    // Open-Meteo fallback (no key required), Mumbai coordinates.
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=19.076&longitude=72.8777&current=temperature_2m,weather_code',
      { next: { revalidate: 0 } }
    );
    if (!res.ok) throw new Error('Open-Meteo request failed');
    const json = await res.json();
    return NextResponse.json({
      city: 'Mumbai',
      tempC: Math.round(json.current.temperature_2m),
      condition: weatherCodeToLabel(json.current.weather_code)
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 502 });
  }
}

function weatherCodeToLabel(code: number): string {
  if (code === 0) return 'Clear';
  if ([1, 2, 3].includes(code)) return 'Cloudy';
  if ([45, 48].includes(code)) return 'Fog';
  if (code >= 51 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Showers';
  if (code >= 95) return 'Storm';
  return 'N/A';
}
