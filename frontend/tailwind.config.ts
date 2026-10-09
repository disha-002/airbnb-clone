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
      // Measured on airbnb.co.in: Airbnb emphasises text with weight 500 almost everywhere (titles, buttons, labels),
      // and uses 600 only for a few things like home-row titles and badges. So `font-semibold` is 500 here, and
      // the real 600s use `font-heavy`.
      fontWeight: { semibold: "500", heavy: "600" },
      // Airbnb sets 16px labels and buttons on a 20px line (Tailwind's default is 24px). Multi-line paragraphs
      // set their own leading.
      fontSize: { base: ["16px", "20px"] },
      fontFamily: { sans: ["Airbnb Cereal VF", "var(--font-figtree)", "Circular", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
