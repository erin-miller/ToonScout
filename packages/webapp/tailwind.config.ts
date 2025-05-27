import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx,html}",
    "./styles/**/*.css",
  ],
  safelist: ["dark", "scale-up"],
  theme: {
    extend: {
      colors: {
        "toon-up": "var(--toon-up)",
        trap: "var(--trap)",
        lure: "var(--lure)",
        sound: "var(--sound)",
        throw: "var(--throw)",
        squirt: "var(--squirt)",
        drop: "var(--drop)",
        gagblue: "var(--gagblue)",
        blue: {
          100: "var(--blue-100)",
          200: "var(--blue-200)",
          300: "var(--blue-300)",
          400: "var(--blue-400)",
          500: "var(--blue-500)",
          600: "var(--blue-600)",
          700: "var(--blue-700)",
          800: "var(--blue-800)",
          900: "var(--blue-900)",
        },
        pink: {
          100: "var(--pink-100)",
          200: "var(--pink-200)",
          300: "var(--pink-300)",
          400: "var(--pink-400)",
          500: "var(--pink-500)",
          600: "var(--pink-600)",
          700: "var(--pink-700)",
          800: "var(--pink-800)",
          900: "var(--pink-900)",
        },
        gray: {
          // Light Grays
          100: "#fafafa",
          200: "#f4f4f4",
          300: "#ededed",
          400: "#e0e0e0",
          500: "#c6c6c6",
          600: "#a6a6a6",
          700: "#8b8b8b",

          // Dark Grays
          800: "#686868",
          900: "#434343",
          1000: "#343434",
          1100: "#2d2d2d",
          1200: "#242424",
          1300: "#1b1b1b",
          1400: "#131313",
        },
      },
      fontFamily: {
        mickey: ["mickey", "serif"],
        minnie: ["minnie", "serif"],
        impress: ["impress", "serif"],
      },
    },
  },
  plugins: [
    require("tailwind-scrollbar")({
      nocompatible: true,
    }),
  ],
};
export default config;
