import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefcf3",
          100: "#d6f6e1",
          200: "#b0ecc7",
          300: "#7cdca6",
          400: "#43c47f",
          500: "#1fa863",
          600: "#13874f",
          700: "#106b42",
          800: "#105537",
          900: "#0e462f",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
