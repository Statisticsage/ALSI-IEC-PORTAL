// tailwind.config.js
// Removed: require("tailwindcss-animate") — package not installed, causes build failure.
// If you need animation utilities, run: npm install tailwindcss-animate
// then uncomment the plugins line below.

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        iec: {
          navy:  "#0B1F3A",
          blue:  "#153E75",
          light: "#E8F0FE",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [
    // require("tailwindcss-animate"), // uncomment after: npm install tailwindcss-animate
  ],
};