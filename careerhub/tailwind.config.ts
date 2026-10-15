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
        paper: {
          DEFAULT: "#FAF6ED",
          deep: "#F3EDDE",
          card: "#FFFDF8",
        },
        ink: {
          DEFAULT: "#181310",
          soft: "#4A4239",
          faint: "#7C7264",
        },
        oxblood: {
          DEFAULT: "#7A1C1C",
          dark: "#5E1414",
          light: "#9A2B2B",
        },
        hairline: "#E2DAC6",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        press: "0 1px 0 0 rgba(24,19,16,0.08), 0 8px 24px -12px rgba(24,19,16,0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
