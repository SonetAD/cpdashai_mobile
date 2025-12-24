/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          blue: '#437EF4',
          cyan: '#83E4E1',
          orange: '#FF8D28',
          yellow: '#FFCC00',
        },
        error: {
          red: '#FF383C',
        },
      },
    },
  },
  plugins: [],
}
