import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.{ts,tsx,js,jsx}", "app/**/*.test.{ts,tsx}"],
    exclude: [
      "node_modules",
      "dist",
      ".next",
      "tests-e2e/**",
      "playwright.config.*",
    ],
    environment: "node",
  },
});
