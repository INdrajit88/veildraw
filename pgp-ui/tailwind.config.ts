import type { Config } from 'tailwindcss';

/**
 * VeilDraw design tokens.
 *
 * Language: deep neutral "midnight" surfaces, one confident indigo accent,
 * calm semantic states, hairline borders, subtle depth. No neon, no glass
 * everywhere — elevation comes from surface steps and one quiet glow.
 */
const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: [
          '"SF Pro Display"',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'var(--font-inter)',
          'sans-serif',
        ],
        sans: [
          '"SF Pro Text"',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'var(--font-inter)',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          'var(--font-mono)',
          '"SF Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          'monospace',
        ],
      },
      colors: {
        primary: {
          DEFAULT: '#5b7cfa', // Midnight indigo — the single interactive accent
          focus: '#4e6cf5',
          bright: '#7b93fc',
          soft: 'rgba(91, 124, 250, 0.12)',
          glow: 'rgba(91, 124, 250, 0.3)',
        },
        violet: {
          DEFAULT: '#8b5cf6', // Reserved for ZK/privacy moments only
          soft: 'rgba(139, 92, 246, 0.12)',
          glow: 'rgba(139, 92, 246, 0.25)',
        },
        emerald: {
          DEFAULT: '#34d399',
          soft: 'rgba(52, 211, 153, 0.12)',
          glow: 'rgba(52, 211, 153, 0.25)',
        },
        amber: {
          DEFAULT: '#fbbf24',
          soft: 'rgba(251, 191, 36, 0.12)',
        },
        rose: {
          DEFAULT: '#fb7185',
          soft: 'rgba(251, 113, 133, 0.12)',
        },
        ink: {
          DEFAULT: '#f2f4f8',
          'muted-80': '#b7becb',
          'muted-48': '#7c8494',
        },
        body: {
          DEFAULT: '#f2f4f8',
          'on-dark': '#ffffff',
          muted: '#9aa3b2',
        },
        canvas: '#0a0b0f',
        parchment: '#0e1015',
        pearl: '#12151d',
        tile: {
          1: '#0f1118',
          2: '#141824',
          3: '#1a1f2e',
        },
        'surface-black': '#050608',
        chip: '#1a1f2b',
        hairline: 'rgba(255, 255, 255, 0.08)',
        'divider-soft': 'rgba(255, 255, 255, 0.05)',
      },
      borderRadius: {
        none: '0px',
        xs: '6px',
        sm: '10px',
        md: '14px',
        lg: '20px',
        xl: '24px',
        pill: '9999px',
        full: '9999px',
      },
      boxShadow: {
        // Quiet depth: inner top highlight + soft ambient shadow. No neon.
        card: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.04), 0 12px 32px -16px rgba(0, 0, 0, 0.55)',
        'card-hover':
          'inset 0 1px 0 0 rgba(255, 255, 255, 0.06), 0 20px 44px -20px rgba(0, 0, 0, 0.65)',
        raised: '0 24px 48px -24px rgba(0, 0, 0, 0.7)',
        modal: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 32px 80px -24px rgba(0, 0, 0, 0.8)',
        // The single allowed glow — primary CTAs and focus moments only.
        'glow-primary': '0 0 0 1px rgba(91, 124, 250, 0.32), 0 6px 28px -8px rgba(91, 124, 250, 0.45)',
      },
      maxWidth: {
        content: '1040px',
        grid: '1360px',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
        'pulse-slow': 'pulseSoft 4s ease-in-out infinite',
        'float-slow': 'floatSlow 7s ease-in-out infinite',
        indeterminate: 'indeterminate 1.6s ease-in-out infinite',
        shimmer: 'shimmer 1.8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '0.9' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        indeterminate: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(250%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
