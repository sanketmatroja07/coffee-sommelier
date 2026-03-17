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
        coffee: {
          50: "#faf7f5",
          100: "#f3ebe5",
          200: "#e5d5c8",
          300: "#d4b99a",
          400: "#c49a70",
          500: "#b78252",
          600: "#a96b42",
          700: "#8d5538",
          800: "#744633",
          900: "#5f3b2c",
        },
      },
    },
  },
  plugins: [],
};

export default config;
