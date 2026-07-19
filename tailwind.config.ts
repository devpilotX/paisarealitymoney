import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary is remapped to the new navy so every existing text-primary /
        // bg-primary / border-primary across the site picks up the new design.
        primary: {
          DEFAULT: '#1C3A5E',
          50: '#E9EEF3',
          100: '#C8D4E0',
          200: '#9DB0C6',
          300: '#6E88A8',
          400: '#47648B',
          500: '#1C3A5E',
          600: '#183350',
          700: '#132A45',
          800: '#0F2237',
          900: '#0A1826',
        },
        // Newspaper / vintage palette (mirrors index.html :root)
        paper: {
          DEFAULT: '#F3EAD6',
          2: '#EDE2C9',
          3: '#E6D9BC',
        },
        navy: {
          DEFAULT: '#1C3A5E',
          deep: '#132A45',
        },
        brand: {
          red: '#A62822',
          'red-deep': '#8A2019',
          yellow: '#E7B23B',
          'yellow-soft': '#F0D089',
        },
        brown: {
          DEFAULT: '#43301F',
          2: '#5A4530',
          line: '#7A6244',
        },
        ink: '#2B2216',
        muted: {
          DEFAULT: '#6D5E48',
          // Darkened from #8A7A61 to meet WCAG AA (4.5:1) on the paper
          // background. #756547 gives ~4.7:1 for small secondary text.
          2: '#756547',
        },
        line: {
          DEFAULT: '#CDB98E',
          soft: '#DBCBA5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'Times New Roman', 'Noto Serif', 'serif'],
      },
      fontSize: {
        base: ['16px', '24px'],
        lg: ['18px', '28px'],
        xl: ['20px', '30px'],
        '2xl': ['24px', '32px'],
        '3xl': ['28px', '36px'],
        '4xl': ['32px', '40px'],
        '5xl': ['44px', '1.1'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      maxWidth: {
        'content': '1140px',
      },
      backgroundImage: {
        'paper-dots': 'radial-gradient(rgba(120,98,68,.08) 1px, transparent 1px)',
      },
      backgroundSize: {
        'dots-22': '22px 22px',
      },
    },
  },
  plugins: [],
};

export default config;
