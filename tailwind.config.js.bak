/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
      colors: {
        // Series-A FinTech Palette
        bg: "#0A0F1E", // Deeper, more institutional blue
        "bg-soft": "#141B2D",
        surface: "rgba(30, 41, 59, 0.5)",
        "surface-2": "rgba(51, 65, 85, 0.5)",
        border: "rgba(255, 255, 255, 0.08)",
        "border-strong": "rgba(255, 255, 255, 0.15)",
        text: "#F8FAFC",
        muted: "#94A3B8",
        accent: {
          DEFAULT: "#3B82F6",
          light: "#60A5FA",
          dark: "#2563EB",
          glow: "rgba(59, 130, 246, 0.5)",
        },
        "accent-secondary": {
          DEFAULT: "#8B5CF6", // Violet
          light: "#A78BFA",
          dark: "#7C3AED",
          glow: "rgba(139, 92, 246, 0.5)",
        },
        danger: "#EF4444",
        success: "#10B981",
      },
      borderRadius: {
        md: "var(--radius)",
      },
      boxShadow: {
        'glass-sm': '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
        'glass-md': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'accent-glow': '0 0 20px rgba(59, 130, 246, 0.3)',
      },
      animation: {
        'subtle-pulse': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
};
