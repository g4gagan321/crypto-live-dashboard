import { Header } from '@/components/Header';
import { InstrumentGrid } from '@/components/InstrumentGrid';
import { BottomBar } from '@/components/BottomBar';
import { ExtrasStrip } from '@/components/ExtrasStrip';
import { MarketPulseStrip } from '@/components/MarketPulseStrip';
import { ObsModeProvider, ObsModeToggle } from '@/components/ObsModeProvider';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

// Single-screen, no-scroll, 16:9-optimized broadcast layout:
//   Header (fixed height)
//   Extras strip (fixed height): world clocks + weather
//   Market Pulse strip (fixed height): FII/DII flows + Nifty 50 movers
//   Main: a grid of large, readable live-price tiles with sparkline + flash motion
//   Bottom bar (fixed height): news ticker + countdowns
export default function DashboardPage() {
  return (
    <ObsModeProvider>
      <main className="grid h-screen w-screen grid-rows-[56px_32px_40px_1fr_44px] gap-2 bg-terminal-bg p-2">
        <ErrorBoundary label="HEADER">
          <Header />
        </ErrorBoundary>

        <ErrorBoundary label="EXTRAS">
          <ExtrasStrip />
        </ErrorBoundary>

        <ErrorBoundary label="MARKET PULSE">
          <MarketPulseStrip />
        </ErrorBoundary>

        <ErrorBoundary label="INSTRUMENTS">
          <InstrumentGrid />
        </ErrorBoundary>

        <ErrorBoundary label="BOTTOM BAR">
          <BottomBar />
        </ErrorBoundary>
      </main>
      <ObsModeToggle />
    </ObsModeProvider>
  );
}
