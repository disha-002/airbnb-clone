import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Theme tokens live in globals.css as RGB triplets so light/dark can swap them and `ink/60` still works.
      colors: {
        rausch: "#FF385C",
        ink: "rgb(var(--ink) / <alpha-value>)",
        hairline: "rgb(var(--hairline) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        soft: "rgb(var(--soft) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
      },
      boxShadow: {
        pill: "0 3px 12px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)",
        tab: "0 2px 4px rgba(0,0,0,0.18)",
      },
      borderRadius: { card: "20px" },
      fontFamily: { sans: ["var(--font-inter)", "Circular", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
