/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        night: {
          900: '#0a0b18',
          800: '#111327',
          700: '#1a1f3a',
          600: '#252b4a',
        },
        moon: {
          400: '#c4a86b',
          300: '#e0c990',
          200: '#f5e6b8',
        },
        wolf: {
          500: '#c0392b',
          400: '#e74c3c',
        },
        village: {
          500: '#27ae60',
          400: '#2ecc71',
        },
      },
    },
  },
  plugins: [],
};
