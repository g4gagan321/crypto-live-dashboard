import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Terminal-style palette. Editable brand accent lives in config/dashboard.config.json,
        // and is applied at runtime via CSS variables set in layout.tsx.
        terminal: {
          // Single cohesive dark surface, matching the reference mockup's
          // own palette (bg #090B10, cards #121722) — not a black-frame/
          // white-card hybrid.
          bg: '#090b10',
          panel: '#121722',
          panel2: '#161c26',
          border: '#232b38',
          up: '#00d26a',
          down: '#ff4d57',
          danger: '#ff4d57',
          primary: '#00d26a',
          amber: '#ffc857',
          text: '#ffffff',
          dim: '#a8b0be'
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
