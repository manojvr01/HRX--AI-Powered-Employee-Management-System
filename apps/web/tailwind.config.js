/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#051424',
        surface: {
          DEFAULT: '#051424',
          dim: '#030d17',
          bright: '#1c2b3c',
          lowest: '#010f1f',
          low: '#0a1726',
          container: '#0f2035',
          high: '#162b45',
          highest: '#1f3857',
          variant: '#273647',
        },
        'on-surface': {
          DEFAULT: '#d4e4fa',
          variant: '#94a3b8',
          muted: '#64748b',
        },
        primary: {
          DEFAULT: '#6366f1',
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
          container: '#6366f1',
          'on-container': '#ffffff',
          dim: '#c0c1ff',
        },
        secondary: {
          DEFAULT: '#4edea3',
          container: '#00a572',
          'on-container': '#00311f',
          dim: '#10b981',
        },
        tertiary: {
          DEFAULT: '#ffb95f',
          container: '#ca8100',
          'on-container': '#3e2400',
        },
        error: {
          DEFAULT: '#ffb4ab',
          container: '#93000a',
          'on-container': '#ffdad6',
        },
        slate: {
          850: '#111e33',
          950: '#040d1a',
        },
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'glass-hover': '0 12px 40px -4px rgba(99, 102, 241, 0.25)',
        'glow-primary': '0 0 24px -4px rgba(99, 102, 241, 0.45)',
        'glow-secondary': '0 0 24px -4px rgba(78, 222, 163, 0.35)',
        'inner-specular': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.12)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
