import type { Metadata } from 'next';
import './globals.css';
import { config } from '@/lib/config';

export const metadata: Metadata = {
  title: `${config.brand.name} — Live Markets Desk`,
  description: 'Real-time 24x7 crypto & macro markets broadcast dashboard.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className="font-display antialiased"
        style={
          {
            '--brand-primary': config.theme.primaryColor,
            '--brand-danger': config.theme.dangerColor,
            '--brand-amber': config.theme.amberColor,
            '--brand-bg': config.theme.backgroundColor,
            '--brand-panel': config.theme.panelColor
          } as React.CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}
