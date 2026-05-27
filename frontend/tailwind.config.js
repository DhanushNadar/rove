/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#121212', // Excalidraw dark mode background
        panel: '#232329',
        border: '#36363d',
        accent: '#a5b4fc', // indigo-300
      }
    },
  },
  plugins: [],
}
