/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'itgeek': {
          teal: '#19A6A6',
          'teal-dark': '#0d7377',
          'teal-light': '#1cc4c4',
          orange: '#E8491B',
          'orange-dark': '#c93a12',
          'orange-light': '#f05a2e',
        },
      },
      fontFamily: {
        sans: ['"Work Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
