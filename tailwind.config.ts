import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // New token-based colors
        bg: "var(--bg)",
        bgSoft: "var(--bg-soft)",
        surface: "var(--surface)",
        surface2: "var(--surface-2)",
        border: "var(--border)",
        text: "var(--text)",
        muted: "var(--muted)",
        accent: "var(--accent)",
        accent2: "var(--accent-2)",
        danger: "var(--danger)",
        // Back-compat aliases
        fg: "var(--color-fg)",
        surfaceHover: "var(--color-surface-hover)",
        borderStrong: "var(--color-border-strong)",
        success: "var(--color-success)",
      },
      borderRadius: {
        md: "var(--radius)",
        DEFAULT: "var(--radius)",
      },
      boxShadow: {
        token: "var(--shadow)",
      },
      spacing: {
        1: "var(--space-1)",
        2: "var(--space-2)",
        3: "var(--space-3)",
        4: "var(--space-4)",
        6: "var(--space-6)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "grad-hero": "var(--grad-hero)",
      },
    },
  },
  plugins: [],
};
export default config;
