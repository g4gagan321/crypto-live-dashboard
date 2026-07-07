import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Terminal-style palette. Editable brand accent lives in config/dashboard.config.json,
        // and is applied at runtime via CSS variables set in layout.tsx.
        terminal: {
          bg: '#05070a',
          panel: '#0b0f16',
          panel2: '#0f141d',
          border: '#1c2532',
          up: '#00e07a',
          down: '#ff3b5c',
          amber: '#ffb020',
          text: '#e8edf3',
          dim: '#7c8896'
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
