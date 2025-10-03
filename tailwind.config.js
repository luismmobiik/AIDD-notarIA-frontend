/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1e40af',      // blue-700 - Professional Blue
        secondary: '#f3f4f6',    // gray-100 - Light Gray
        accent: '#10b981',       // green-500 - Trust Green
        text: '#1f2937',         // gray-800 - Dark Gray
      },
    },
  },
  plugins: [
    require('tailwindcss-primeui')
  ],
}

