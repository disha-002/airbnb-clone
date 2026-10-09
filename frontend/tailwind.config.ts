import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { rausch: "#FF385C", ink: "#222222", hairline: "#DDDDDD", muted: "#6A6A6A", soft: "#F7F7F7" },
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
