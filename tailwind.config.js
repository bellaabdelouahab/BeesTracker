/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        translateBox: {
          '0%': { transform: 'translateY(-100px)',
            opacity: 0 },
          
          '100%': { transform: 'translateY(0px)',
          opacity: 1 },
          
        },
      },
      animation: {
        translateBox: 'translateBox 400ms ease-in-out ',
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
