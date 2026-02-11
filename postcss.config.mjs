const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {}, // Autoprefixer is implicitly handled by Tailwind v4 usually, but safe to keep if needed for older browsers
  },
};
export default config;
