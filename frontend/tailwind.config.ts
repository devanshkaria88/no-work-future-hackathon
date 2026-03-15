import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        foreground: '#ededed',
        'agent-scout': '#1D9E75',
        'agent-packager': '#7F77DD',
        'agent-matchmaker': '#D85A30',
        'agent-buyer': '#378ADD',
        'agent-seller': '#EF9F27',
        'agent-companion': '#FAC775',
        'nes-dark': '#1a1a2e',
        'nes-border': '#333',
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
      },
      animation: {
        'bounce-sm': 'bounce-sm 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        'bounce-sm': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(255,255,255,0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(255,255,255,0.6)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
