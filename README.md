# APEX MARKETS — India Live Markets Dashboard

A Bloomberg Terminal / CNBC-style, single-screen, 24×7 financial markets dashboard built for broadcasting on YouTube Live via OBS Studio, targeted at an Indian markets audience. No scrolling, no manual refresh, dark theme, 16:9-optimized, and designed to survive weeks of unattended uptime.

Layout, top to bottom: header (UTC/IST clocks, LIVE badge) → world clocks + weather strip → a "Market Pulse" strip (FII/DII net flows, Nifty 50 top gainers/losers) → a grid of 8 big live-price tiles (Nifty 50, Bank Nifty, India VIX, USD/INR, Gold, Silver, Crude WTI, Bitcoin) — each with a rolling sparkline and a green/red flash on every tick so the screen reads as "alive" between polls → a scrolling headline ticker (Economic Times + Moneycontrol RSS) with US CPI / FOMC / Bitcoin halving countdowns.

Nifty 50 / Bank Nifty / India VIX are real broker-fed NSE data via AngelOne SmartAPI (free with a demat account) when configured, since TradingView's anonymous embeds can't legally show NSE-licensed data to a logged-out viewer — see the "NSE data" section below for why, and how the fallback works if you don't set up AngelOne.

## What's inside

- Next.js 14 (App Router) + React 18 + TypeScript, strict mode
- Tailwind CSS dark "terminal" theme
- Server-side API routes that proxy free/broker market-data APIs (keys and credentials never reach the browser)
- Resilient client-side polling with exponential backoff, stale-data fallback, and automatic reconnect — no WebSocket-dependent free market-data API exists at broad reliability, so polling (10s–15min depending on data type) is used deliberately instead of unstable public WebSocket feeds
- A hand-rolled TOTP (RFC 6238) generator + AngelOne SmartAPI session client for real Nifty 50 / Bank Nifty / India VIX quotes, with an automatic Yahoo Finance fallback if AngelOne isn't configured
- Client-side sparkline + tick-flash motion per tile, built from a rolling in-memory price buffer (no extra network calls)
- Panel-level React error boundaries + a route-level error boundary that self-recovers
- An "OBS Mode" that hides the cursor, disables hover/tooltips, and removes scrollbars
- A single editable JSON config file for brand, colors, widgets, and refresh intervals

## Project structure

```
crypto-live-dashboard/
├─ config/dashboard.config.json     # Brand, theme, widget toggles, refresh intervals, countdown dates
├─ src/
│  ├─ app/
│  │  ├─ page.tsx                   # Main broadcast layout (grid, no scroll)
│  │  ├─ layout.tsx                 # Root layout, injects theme CSS vars from config
│  │  ├─ globals.css                # Dark theme + OBS-mode + tick-flash CSS
│  │  ├─ error.tsx                  # Route-level error boundary (auto-recovers in 5s)
│  │  └─ api/                       # Server routes: crypto, global, fng, fx, quotes, nse-quotes, fiidii, movers, news, whales, economic, weather
│  ├─ components/                   # Header, InstrumentGrid, MarketPulseStrip, BottomBar, ExtrasStrip, ObsModeProvider, common/ (Panel, Sparkline, ChangeBadge...)
│  ├─ hooks/                        # usePolling, useClock, useObsMode, useCryptoData, useGlobalData, useFearGreed, useFx, useQuotes, useNseQuotes, useMarketPulse, usePriceMotion, useNews, useCountdown, useWeather
│  ├─ lib/                          # config loader, formatters, fetch wrapper, totp.ts, angelone.ts
│  └─ types/                        # Shared TypeScript interfaces
├─ .env.example
└─ package.json
```

## 1. Install & run locally

Requires Node.js 18.18+ and npm.

```bash
cd crypto-live-dashboard
npm install
cp .env.example .env.local   # optional — works with zero keys using free tiers
npm run dev
```

Open `http://localhost:3000`. The dashboard starts fetching immediately and keeps updating without any reload.

Production build:

```bash
npm run build
npm start        # serves on port 3000
```

## 2. Data sources — what's free and what needs a key

Every instrument on this dashboard runs on a free tier today. Nothing requires a paid plan to go live.

| Data | Source | Key needed? | Notes |
|---|---|---|---|
| Nifty 50, Bank Nifty, India VIX | AngelOne SmartAPI, falls back to Yahoo Finance (Nifty/Bank Nifty only) | AngelOne creds recommended | See "Why GIFT Nifty/India VIX didn't work, and how AngelOne fixes it" below |
| Gold, Silver, Crude WTI (all in $), USD/INR | Yahoo Finance keyless chart endpoint + exchangerate.host (falls back to frankfurter.app) | No | |
| Bitcoin ($) price + market cap | CoinGecko public API | No (optional key raises rate limits) | |
| FII/DII daily net flows | NSE's own site (unofficial, cookie-handshake scrape) | No | Best-effort — see caveats below |
| Nifty 50 top gainers/losers | Yahoo Finance, batched over the 50 index constituents | No | |
| Fear & Greed Index | alternative.me | No | |
| News ticker | Economic Times Markets RSS + Moneycontrol RSS, plus CryptoCompare for BTC headlines | No | All keyless RSS/JSON feeds |
| Weather | Open-Meteo (default) or OpenWeatherMap | No (OpenWeatherMap key optional for named-city lookup) | Defaults to Mumbai coordinates |

Optional environment variables (all have working fallbacks if left blank):

| Variable | Purpose |
|---|---|
| `ANGELONE_API_KEY` / `ANGELONE_CLIENT_CODE` / `ANGELONE_PASSWORD` / `ANGELONE_TOTP_SECRET` | Real live Nifty 50 / Bank Nifty / India VIX. Free with a personal AngelOne demat account — see below |
| `COINGECKO_API_KEY` | Raises CoinGecko rate limits |
| `CRYPTOCOMPARE_API_KEY` | Raises CryptoCompare news rate limits |
| `WHALE_ALERT_API_KEY` | Only relevant if you re-enable the (currently off) crypto whale-alert panel — needs a paid whale-alert.io plan for real data |
| `OPENWEATHER_API_KEY` / `OPENWEATHER_CITY` | Named-city weather instead of the Open-Meteo/Mumbai default |

See `.env.example` for the full list with comments.

### Why GIFT Nifty / India VIX didn't work, and how AngelOne fixes it

TradingView splits its data into exchange-licensed feeds (NSE, NSE IX/GIFT City, BSE) and non-licensed feeds (crypto, commodities, TradingView's own synthetic bond-yield data). Anonymous embedded widgets — which is what an OBS Browser Source always is — are only allowed to show the non-licensed feeds; NSE-licensed data legally requires the viewer to be signed into a TradingView account. That's a data-licensing rule, not a bug, and it's why Nifty/Bank Nifty/India VIX rendered blank while Bitcoin, Gold, and commodities worked fine.

The fix used here: [AngelOne SmartAPI](https://smartapi.angelone.in) is free for anyone with a personal AngelOne trading + demat account and gives real broker-fed LTP data for NIFTY 50, BANK NIFTY, and INDIA VIX — no TradingView involved. To enable it:

1. Open an AngelOne account (if you don't have one) and create an app at smartapi.angelone.in to get `ANGELONE_API_KEY`.
2. `ANGELONE_CLIENT_CODE` and `ANGELONE_PASSWORD` are your normal AngelOne login ID and password/MPIN.
3. In the AngelOne app, go to **Profile → Settings → Enable TOTP** — it shows a QR code and, underneath it, a plain-text secret. Copy that secret string (not a 6-digit code) into `ANGELONE_TOTP_SECRET`. The server generates fresh 30-second TOTP codes from that secret on every login, the same way an authenticator app would.
4. Add all four variables to `.env.local` (dev) or Vercel's environment variables (prod), redeploy, and the three tiles switch from "Feed unavailable" to live numbers automatically — no code change needed. Without these four variables, Nifty 50 / Bank Nifty fall back to a delayed Yahoo Finance feed and India VIX shows "Feed unavailable" (Yahoo has no VIX-India symbol).

**GIFT Nifty was dropped entirely** rather than faked: it trades on NSE IX in GIFT City, which retail brokers like AngelOne and Zerodha don't provide access to (that needs a separate GIFT-City-registered broker). There's no free, live, legitimate path to it, so it's gone from the grid instead of showing a permanently broken tile. India 10Y / US 10Y yield tiles were also removed to keep the grid focused on the instruments you actually asked to keep front and center.

**FII/DII flows caveat:** NSE has no official public API for this — the route does the same cookie-handshake trick community scraping tools use (visit the homepage, capture cookies, then call NSE's internal endpoint). NSE can change this or block a hosting provider's IP range without notice; if it stops working, the tile keeps showing the last good figure rather than breaking, and you'll need to either try a different Vercel region or swap in a paid data vendor.

## 3. Editing the dashboard (no code changes needed)

Open `config/dashboard.config.json` to change:

- `brand.name`, `brand.logoText`, `brand.logoUrl` — branding
- `theme.*` — primary/danger/amber/background colors (applied as CSS variables)
- `widgets.*` — enable/disable individual panels
- `refreshIntervalsMs.*` — polling cadence per data type
- `majorCoins` — CoinGecko coin ID(s) used for the BTC hero panel (defaults to `["bitcoin"]` only)
- `newsSources` — enable/disable and edit the RSS/API sources for the headline ticker
- `economicEvents.usCpiNext` / `fomcNext` / `bitcoinHalvingNext` — countdown target dates (ISO 8601, UTC) — update these each cycle since no free real-time economic calendar API is reliable enough for a live broadcast
- `worldClocks` — which IANA time zones appear in the extras strip

Changes take effect on the next build/restart (or immediately in `npm run dev`).

## 4. Push to GitHub, then deploy on Vercel

**Create the repo:**

```bash
cd crypto-live-dashboard
git init
git add .
git commit -m "Initial commit: India live markets dashboard"
```

Create an empty repo on GitHub (github.com → **New repository**, don't initialize with a README), then:

```bash
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git branch -M main
git push -u origin main
```

(Or use the GitHub CLI instead: `gh repo create <your-repo-name> --public --source=. --remote=origin --push`.)

**Deploy on Vercel — two ways:**

- **Dashboard (easiest):** go to vercel.com → **Add New → Project** → import the GitHub repo you just pushed → Vercel auto-detects Next.js → click **Deploy**. Every future `git push` to `main` auto-redeploys.
- **CLI:**
  ```bash
  npm install -g vercel
  vercel login
  vercel            # first deploy, follow prompts
  vercel --prod      # promote to production
  ```

In the Vercel dashboard, add any `.env.example` variables you want under **Project → Settings → Environment Variables**, then redeploy. Vercel's serverless functions run the `api/*` routes; no extra configuration is required since `next.config.mjs` is already set up for standard hosting. Once deployed you'll get a permanent URL like `https://your-project.vercel.app` — that's the URL you point OBS's Browser Source at (see Section 6).

## 5. Running 24×7 on a VPS (recommended for a permanent broadcast machine)

A small VPS (2 vCPU / 4GB RAM is plenty) running Ubuntu is the most reliable setup for a machine that also runs OBS Studio.

```bash
# On the VPS
sudo apt update && sudo apt install -y nodejs npm nginx
git clone <your-repo-url> crypto-live-dashboard
cd crypto-live-dashboard
npm install
npm run build

# Run continuously with pm2 (auto-restarts on crash, survives reboots)
sudo npm install -g pm2
pm2 start npm --name "crypto-dashboard" -- start
pm2 save
pm2 startup        # follow the printed command to enable boot-start
```

Useful pm2 commands: `pm2 logs crypto-dashboard`, `pm2 restart crypto-dashboard`, `pm2 monit`.

Optional: put Nginx in front as a reverse proxy on port 80 → 3000, and add a systemd watchdog / `pm2-logrotate` module so logs don't grow unbounded over weeks of uptime.

If the browser rendering the dashboard runs on the same VPS (headless Chrome + OBS), install a lightweight desktop (e.g. `xfce4` + `xvfb`) or use OBS's own headless "Browser Source" rendering, which does not require a visible desktop at all.

## 6. Connecting to OBS Studio

1. In OBS, add a **Browser Source**.
2. Set the URL to your running dashboard, e.g. `http://localhost:3000?obs=1` (the `?obs=1` query param turns on OBS Mode automatically — no clicking required).
3. Set **Width: 1920, Height: 1080** to match the dashboard's 16:9 design.
4. Check **"Shutdown source when not visible"** OFF, and **"Refresh browser when scene becomes active"** OFF — the dashboard already self-updates and refreshing would reset its polling/backoff state.
5. Under **Advanced**, set **FPS** to 30 (this is a data dashboard, not motion video — 30fps is plenty and saves CPU).
6. If you prefer to toggle OBS Mode manually instead of the URL param, a small "ENABLE OBS MODE" button appears in the top-right corner of the page — it disappears once enabled.

OBS Mode removes the cursor, hover states, tooltips, and scrollbars so nothing but the intended broadcast content is ever visible on stream.

## 7. Streaming continuously to YouTube Live

1. In YouTube Studio → **Go Live** → **Stream**, create a persistent/24×7 stream key (YouTube supports long-running or scheduled recurring streams for this use case).
2. In OBS → **Settings → Stream**, choose **YouTube - RTMPS** as the service and paste your stream key.
3. Under **Settings → Output**, use a streaming bitrate suited to 1080p30 (roughly 4500–6000 kbps, "veryfast" or "fast" x264 preset, or NVENC/QuickSync hardware encoding if available — data dashboards compress extremely well since large areas are static).
4. Start streaming from OBS; YouTube will show "Live" once it picks up the signal.
5. For true 24×7 uptime, run OBS on the same always-on VPS/machine described in Section 5 (a headless Linux box with a virtual display, or a small dedicated Windows/Mac mini) so the stream doesn't depend on a personal computer staying on.
6. Consider OBS's **Auto-Restart Stream** plugin or a systemd/pm2-supervised OBS launch script so the stream recovers automatically from a network blip without manual intervention.

## Performance & reliability notes

- Polling (not raw `setInterval`) is used with a mandatory wait for each response before scheduling the next request, so a slow API call can never stack requests.
- Every widget is wrapped in its own error boundary — a bad API response or a rendering bug takes down one card, not the whole screen, and it self-heals after 10 seconds.
- The root route also has a Next.js `error.tsx` boundary that retries the whole page after 5 seconds if something slips past the panel boundaries.
- API routes cache upstream responses briefly server-side and serve the last-known-good payload (marked stale) if an upstream call fails, so the on-air numbers never blank out.
- No `localStorage`/`sessionStorage` dependency beyond the OBS Mode toggle, which is non-critical to data correctness.
