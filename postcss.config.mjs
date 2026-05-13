// postcss.config.mjs
// File extension is .mjs — must use ESM export default, NOT module.exports
// Tailwind v3 + autoprefixer only. No @tailwindcss/postcss (that's Tailwind v4).

const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
