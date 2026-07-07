import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Terminal-style palette. Editable brand accent lives in config/dashboard.config.json,
        // and is applied at runtime via CSS variables set in layout.tsx.
        terminal: {
          // Hybrid palette: black outer chrome (bg — the frame/gaps between
          // panels) with light/white panel cards for readability. Strong
          // green/red accents so price direction still reads instantly.
          bg: '#050608',
          panel: '#ffffff',
          panel2: '#fafafa',
          border: '#e2e4e9',
          up: '#0a8f4e',
          down: '#d81f3d',
          danger: '#d81f3d',
          primary: '#0a8f4e',
          amber: '#b4790a',
          text: '#12151a',
          dim: '#6b7280'
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        display: ['"Inter"', 'system-ui', 'sans-serif']
      },
      animation: {
        ticker: 'ticker 45s linear infinite',
        pulseLive: 'pulseLive 1.6s ease-in-out infinite'
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' }
        },
        pulseLive: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' }
        }
      }
    }
  },
  plugins: []
};

export default config;
