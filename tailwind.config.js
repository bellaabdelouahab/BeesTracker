/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    backgroundImage: {
      beeFarm: "url('./assets/images/beeBackground.jpg')",
    },
    extend: {},
  },
  plugins: [],
};
