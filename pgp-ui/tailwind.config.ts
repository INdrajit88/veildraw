import type { Config } from 'tailwindcss';

// Design tokens sourced from DESIGN.md (Apple design analysis)
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
        // SF Pro on Apple platforms; Inter (loaded via next/font) elsewhere
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
        mono: ['"SF Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      colors: {
        primary: '#0066cc', // Action Blue — the single interactive color
        'primary-focus': '#0071e3',
        'primary-on-dark': '#2997ff', // Sky Link Blue — dark tiles only
        ink: {
          DEFAULT: '#1d1d1f',
          'muted-80': '#333333',
          'muted-48': '#7a7a7a',
        },
        body: {
          DEFAULT: '#1d1d1f',
          'on-dark': '#ffffff',
          muted: '#cccccc',
        },
        canvas: '#ffffff',
        parchment: '#f5f5f7',
        pearl: '#fafafc',
        tile: {
          1: '#272729',
          2: '#2a2a2c',
          3: '#252527',
        },
        'surface-black': '#000000',
        chip: '#d2d2d7',
        hairline: '#e0e0e0',
        'divider-soft': '#f0f0f0',
      },
      borderRadius: {
        none: '0px',
        xs: '5px',
        sm: '8px',
        md: '11px',
        lg: '18px',
        pill: '9999px',
        full: '9999px',
      },
      boxShadow: {
        // The single shadow in the system — product imagery only
        product: 'rgba(0, 0, 0, 0.22) 3px 5px 30px 0',
      },
      maxWidth: {
        content: '980px',
        grid: '1440px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
