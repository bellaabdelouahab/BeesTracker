/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        translateBox: {
          '0%': { transform: 'translate(10px,10px)' },
          '50%': { transform: 'rotate(10px,10px)' },
          '100%': { transform: 'rotate(10px,10px)' },
          
        },
      },
      colors: {
        "primary-yellow": "#FFEB3B",
        "primary-green": "#2CB97D",
        "secondary-green": "#00948C",
      },
    },
  },
  plugins: [],
};
