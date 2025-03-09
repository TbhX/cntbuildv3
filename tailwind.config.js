/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#C8AA6E',
          hover: '#F0E6D2'
        },
        blue: {
          DEFAULT: '#0AC8B9',
          hover: '#0FF3E2'
        },
        dark: {
          DEFAULT: '#091428',
          darker: '#070E1B'
        }
      }
    },
  },
  plugins: [],
};