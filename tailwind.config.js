/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary deep navy
        brand: {
          DEFAULT: '#1e3a5f',
          50: '#f3f6fa',
          100: '#e3ebf3',
          200: '#c2d2e3',
          300: '#94b0cd',
          400: '#5f87b0',
          500: '#3f6a96',
          600: '#2f527b',
          700: '#1e3a5f',
          800: '#1a3254',
          900: '#162a47',
        },
        // Accent teal/green
        accent: {
          DEFAULT: '#10b981',
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(30, 58, 95, 0.08), 0 1px 2px -1px rgba(30, 58, 95, 0.06)',
      },
    },
  },
  plugins: [],
}
