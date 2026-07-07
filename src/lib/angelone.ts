import { generateTotp } from './totp';

// Thin server-side client for AngelOne's SmartAPI. Used for the three NSE
// index feeds (Nifty 50, Bank Nifty, India VIX) that TradingView's anonymous
// embeds can't show and that Yahoo Finance either doesn't carry cleanly or
// only offers on a delay. Requires the user's own AngelOne credentials —
// nothing here works without ANGELONE_* env vars set, and every route that
// uses this degrades to "unavailable" (never a crash) if they're absent.
//
// Auth model: rather than juggling AngelOne's refresh-token rotation, we
// simply re-run the full TOTP login whenever the cached JWT is missing,
// close to expiry, or a request comes back 401 — TOTP codes are always
// derivable from the secret, so there's no "stale refresh token" failure
// mode to handle.

const BASE_URL = 'https://apiconnect.angelone.in';

interface AngelSession {
  jwtToken: string;
  obtainedAt: number;
}

let session: AngelSession | null = null;
const SESSION_TTL_MS = 5 * 60 * 60 * 1000; // proactively re-login every 5h; AngelOne JWTs last ~8h

function authHeaders(apiKey: string, jwt?: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-UserType': 'USER',
    'X-SourceID': 'WEB',
    // AngelOne requires these headers to be present; their values aren't
    // strictly validated for a server-to-server integration like this one.
    'X-ClientLocalIP': '127.0.0.1',
    'X-ClientPublicIP': '106.51.74.100',
    'X-MACAddress': '00:00:00:00:00:00',
    'X-PrivateKey': apiKey,
    ...(jwt ? { Authorization: `Bearer ${jwt}` } : {})
  };
}

export function isAngelOneConfigured(): boolean {
  return Boolean(
    process.env.ANGELONE_API_KEY &&
      process.env.ANGELONE_CLIENT_CODE &&
      process.env.ANGELONE_PASSWORD &&
      process.env.ANGELONE_TOTP_SECRET
  );
}

async function login(): Promise<string> {
  const apiKey = process.env.ANGELONE_API_KEY!;
  const clientcode = process.env.ANGELONE_CLIENT_CODE!;
  const password = process.env.ANGELONE_PASSWORD!;
  const totpSecret = process.env.ANGELONE_TOTP_SECRET!;
  const totp = generateTotp(totpSecret);

  const res = await fetch(`${BASE_URL}/rest/auth/angelbroking/user/v1/loginByPassword`, {
    method: 'POST',
    headers: authHeaders(apiKey),
    body: JSON.stringify({ clientcode, password, totp }),
    // Login must never be cached.
    cache: 'no-store'
  });
  const json = await res.json();
  if (!res.ok || !json?.data?.jwtToken) {
    throw new Error(`AngelOne login failed: ${json?.message ?? res.status}`);
  }
  session = { jwtToken: json.data.jwtToken, obtainedAt: Date.now() };
  return session.jwtToken;
}

async function getJwt(forceRefresh = false): Promise<string> {
  if (!forceRefresh && session && Date.now() - session.obtainedAt < SESSION_TTL_MS) {
    return session.jwtToken;
  }
  return login();
}

export interface AngelQuote {
  tradingsymbol: string;
  ltp: number;
  changePct: number;
}

// Well-known public NSE index tokens on AngelOne's symbol master. These are
// stable in practice but not contractually guaranteed — if a quote silently
// stops resolving, re-derive the token from AngelOne's scrip master file
// (https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json)
// by searching for the instrument name under exch_seg "NSE".
const INDEX_TOKENS: Record<string, { symboltoken: string; tradingsymbol: string }> = {
  nifty50: { symboltoken: '99926000', tradingsymbol: 'Nifty 50' },
  banknifty: { symboltoken: '99926009', tradingsymbol: 'Nifty Bank' },
  indiavix: { symboltoken: '99926017', tradingsymbol: 'India VIX' }
};

async function fetchQuoteBatch(jwt: string, apiKey: string): Promise<Record<string, AngelQuote>> {
  const res = await fetch(`${BASE_URL}/rest/secure/angelbroking/market/v1/quote`, {
    method: 'POST',
    headers: authHeaders(apiKey, jwt),
    body: JSON.stringify({
      mode: 'OHLC',
      exchangeTokens: { NSE: Object.values(INDEX_TOKENS).map((t) => t.symboltoken) }
    }),
    cache: 'no-store'
  });
  if (res.status === 401) throw Object.assign(new Error('AngelOne session expired'), { code: 401 });
  const json = await res.json();
  if (!res.ok || !json?.data?.fetched) {
    throw new Error(`AngelOne quote request failed: ${json?.message ?? res.status}`);
  }

  const bySymboltoken = new Map<string, any>(json.data.fetched.map((q: any) => [q.symbolToken ?? q.symboltoken, q]));
  const result: Record<string, AngelQuote> = {};
  for (const [id, meta] of Object.entries(INDEX_TOKENS)) {
    const q = bySymboltoken.get(meta.symboltoken);
    if (!q) continue;
    const ltp = Number(q.ltp);
    const prevClose = Number(q.close);
    const changePct = prevClose ? ((ltp - prevClose) / prevClose) * 100 : 0;
    result[id] = { tradingsymbol: meta.tradingsymbol, ltp, changePct };
  }
  return result;
}

/** Returns quotes for nifty50 / banknifty / indiavix, retrying once with a fresh login on 401. */
export async function getIndexQuotes(): Promise<Record<string, AngelQuote>> {
  const apiKey = process.env.ANGELONE_API_KEY!;
  try {
    const jwt = await getJwt();
    return await fetchQuoteBatch(jwt, apiKey);
  } catch (err: any) {
    if (err?.code === 401) {
      const jwt = await getJwt(true);
      return await fetchQuoteBatch(jwt, apiKey);
    }
    throw err;
  }
}
