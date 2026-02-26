/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        water: '#D4F3FE',
        maya: '#66D4FA',
        celestial: '#4298D4',
        lapis: '#2466AD',
        yale: '#0C5297',
        yale2: '#104C8F',
      },
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
        raleway: ['Raleway', 'sans-serif'],
      },
    },
  },
  plugins: [],
}