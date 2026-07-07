import { Header } from '@/components/Header';
import { InstrumentGrid } from '@/components/InstrumentGrid';
import { BottomBar } from '@/components/BottomBar';
import { ExtrasStrip } from '@/components/ExtrasStrip';
import { LeftColumn } from '@/components/LeftColumn';
import { RightColumn } from '@/components/RightColumn';
import { NiftyHeatmap } from '@/components/NiftyHeatmap';
import { GlobalMarketsRow } from '@/components/GlobalMarketsRow';
import { ObsModeProvider, ObsModeToggle } from '@/components/ObsModeProvider';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

// Single-screen, no-scroll, 16:9-optimized broadcast layout:
//   Header (fixed height)
//   Extras strip (fixed height): world clocks + weather
//   Compact snapshot row (fixed height): 8 headline instrument tiles
//   Main body (fills remaining space): 3 columns —
//     Left:   Market Breadth + FII/DII + Sector Performance
//     Center: Nifty 50 Heatmap (the largest, most-glanced-at panel)
//     Right:  Top Gainers / Top Losers + India VIX gauge + Market News
//   Global markets strip (fixed height): Dow/Nasdaq/FTSE/DAX/... etc.
//   Bottom bar (fixed height): scrolling news ticker + countdowns
export default function DashboardPage() {
  return (
    <ObsModeProvider>
      <main className="grid h-screen w-screen grid-rows-[56px_24px_72px_1fr_24px_40px] gap-2 bg-terminal-bg p-2">
        <ErrorBoundary label="HEADER">
          <Header />
        </ErrorBoundary>

        <ErrorBoundary label="EXTRAS">
          <ExtrasStrip />
        </ErrorBoundary>

        <ErrorBoundary label="SNAPSHOT">
          <InstrumentGrid />
        </ErrorBoundary>

        <ErrorBoundary label="MAIN BODY">
          <div className="grid h-full min-h-0 grid-cols-[280px_1fr_300px] gap-2">
            <ErrorBoundary label="LEFT COLUMN">
              <LeftColumn />
            </ErrorBoundary>
            <ErrorBoundary label="HEATMAP">
              <NiftyHeatmap />
            </ErrorBoundary>
            <ErrorBoundary label="RIGHT COLUMN">
              <RightColumn />
            </ErrorBoundary>
          </div>
        </ErrorBoundary>

        <ErrorBoundary label="GLOBAL MARKETS">
          <GlobalMarketsRow />
        </ErrorBoundary>

        <ErrorBoundary label="BOTTOM BAR">
          <BottomBar />
        </ErrorBoundary>
      </main>
      <ObsModeToggle />
    </ObsModeProvider>
  );
}
