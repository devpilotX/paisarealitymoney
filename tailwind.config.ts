import type { Config } from 'tailwindcss';

// Design tokens. See docs/design-direction.md. The old palette names (paper, ink,
// muted, line, brown) are kept so existing class names across the site pick up the
// new white, navy and neutral-grey system without a rewrite of every file.
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1C3A5E',
          50: '#EEF2F7',
          100: '#D6E0EB',
          200: '#AFC1D6',
          300: '#7F99B8',
          400: '#4F6E94',
          500: '#1C3A5E',
          600: '#183350',
          700: '#132A45',
          800: '#0F2237',
          900: '#0A1826',
        },
        paper: {
          DEFAULT: '#FFFFFF',
          2: '#F7F8FA',
          3: '#EEF1F5',
        },
        navy: {
          DEFAULT: '#1C3A5E',
          deep: '#0F2237',
          soft: '#EEF2F7',
        },
        brand: {
          red: '#A62822',
          'red-deep': '#8A2019',
          // Kept for the few places that need a warm highlight (warnings, the score gauge).
          yellow: '#D9A21B',
          'yellow-soft': '#FDF3D7',
        },
        // "brown" used to be the dark utility colour; it now maps to neutral slate.
        brown: {
          DEFAULT: '#1F2937',
          2: '#374151',
          line: '#9CA3AF',
        },
        ink: '#111827',
        muted: {
          DEFAULT: '#4B5563',
          2: '#6B7280',
        },
        line: {
          DEFAULT: '#E5E7EB',
          soft: '#F0F2F5',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        // Headings used font-serif everywhere; they now render in the sans face.
        serif: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        // The wordmark keeps its serif.
        display: ['Georgia', 'Times New Roman', 'serif'],
      },
      fontSize: {
        base: ['16px', '26px'],
        lg: ['18px', '28px'],
        xl: ['20px', '30px'],
        '2xl': ['24px', '32px'],
        '3xl': ['30px', '38px'],
        '4xl': ['36px', '44px'],
        '5xl': ['48px', '1.08'],
        '6xl': ['60px', '1.04'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      maxWidth: {
        content: '1200px',
        prose: '70ch',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.04)',
        lift: '0 12px 32px -8px rgba(16, 24, 40, 0.14)',
      },
    },
  },
  plugins: [],
};

export default config;
