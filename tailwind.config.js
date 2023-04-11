/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "primary-yellow": "#FFEB3B",
        "primary-green": "#2CB97D",
        "secondary-green": "#00948C",
      },
    },
  },
  plugins: [],
};
