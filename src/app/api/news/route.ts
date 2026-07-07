import { NextResponse } from 'next/server';
import { config } from '@/lib/config';
import type { NewsItem } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

let cache: { data: NewsItem[]; ts: number } | null = null;
const CACHE_TTL_MS = 60000;

// Lightweight, dependency-free RSS <item> extractor. Indian financial
// publishers (Economic Times, Moneycontrol, Business Standard, etc.) all
// expose free, keyless RSS feeds — no paid news API is required for this
// audience. This is a deliberately small parser (regex over well-formed
// RSS 2.0) rather than pulling in a full XML library, since we only need
// title/link/pubDate out of a predictable feed shape.
function parseRss(xml: string, sourceName: string, limit = 8): NewsItem[] {
  const items: NewsItem[] = [];
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/g) ?? [];
  for (const block of itemBlocks.slice(0, limit)) {
    const title = extractTag(block, 'title');
    const link = extractTag(block, 'link');
    const pubDate = extractTag(block, 'pubDate');
    if (!title || !link) continue;
    items.push({
      id: `${sourceName}-${link}`,
      title: decodeEntities(stripCdata(title)),
      url: stripCdata(link).trim(),
      source: sourceName,
      publishedAt: pubDate ? new Date(pubDate).getTime() : Date.now()
    });
  }
  return items;
}

function extractTag(block: string, tag: string): string | null {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return match ? match[1] ?? null : null;
}

function stripCdata(value: string): string {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim();
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function fetchRssSource(name: string, url: string): Promise<NewsItem[]> {
  const res = await fetch(url, {
    next: { revalidate: 0 },
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MarketsDashboard/1.0)' }
  });
  if (!res.ok) throw new Error(`${name} RSS failed: ${res.status}`);
  const xml = await res.text();
  return parseRss(xml, name);
}

// Secondary global-crypto headline source, kept for the on-screen Bitcoin
// price panel context. Works keyless; CRYPTOCOMPARE_API_KEY raises limits.
async function fetchCryptoCompare(): Promise<NewsItem[]> {
  const key = process.env.CRYPTOCOMPARE_API_KEY;
  const url = `https://min-api.cryptocompare.com/data/v2/news/?lang=EN${key ? `&api_key=${key}` : ''}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`CryptoCompare news failed: ${res.status}`);
  const json = await res.json();
  const items = (json.Data ?? []) as any[];
  return items.slice(0, 6).map((n) => ({
    id: String(n.id),
    title: n.title,
    url: n.url,
    source: n.source_info?.name ?? 'CryptoCompare',
    publishedAt: Number(n.published_on) * 1000
  }));
}

async function fetchAllNews(): Promise<NewsItem[]> {
  const sources = config.newsSources.filter((s) => s.enabled);
  const results = await Promise.allSettled(
    sources.map((s) => (s.rssUrl ? fetchRssSource(s.name, s.rssUrl) : fetchCryptoCompare()))
  );

  const merged: NewsItem[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') merged.push(...r.value);
  }
  if (merged.length === 0) throw new Error('All news sources failed');

  return merged.sort((a, b) => b.publishedAt - a.publishedAt).slice(0, 25);
}

export async function GET() {
  try {
    if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
      return NextResponse.json(cache.data);
    }
    const data = await fetchAllNews();
    cache = { data, ts: Date.now() };
    return NextResponse.json(data);
  } catch (err) {
    if (cache) return NextResponse.json(cache.data, { headers: { 'X-Data-Stale': 'true' } });
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 502 });
  }
}
