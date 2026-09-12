/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#09090b",
        surface: "#121214",
        card: "#18181c",
        border: "#27272a",
        primary: "#f43f5e",
      },
    },
  },
  plugins: [],
};
