// postcss.config.js
// Next.js 16 + Turbopack requires this exact format.
// Do NOT use @tailwindcss/postcss — it's only for Tailwind v4.
// This project uses Tailwind v3 (tailwindcss + autoprefixer).

module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};