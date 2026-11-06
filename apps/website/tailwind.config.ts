import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: "#EAE8E1",
          light: "#F7F4EC",
          warm: "#F4EEDF",
        },
        surface: "#FFFFFF",
        divider: "#D8D4CA",
        "divider-subtle": "#E2DFD6",
        ink: {
          DEFAULT: "#111316",
          muted: "#5A5D64",
          light: "#7A7E87",
          code: "#16181B",
        },
        amber: {
          DEFAULT: "#E57E25",
          dark: "#C96716",
          light: "#FDF2E7",
        },
        accent: {
          DEFAULT: "#E57E25",
          dark: "#C96716",
          light: "#FDF2E7",
        },
        sand: {
          DEFAULT: "#EAE8E1",
          warm: "#F4EEDF",
          border: "#D8D4CA",
        },
      },
      borderRadius: {
        none: "0px",
        DEFAULT: "0px",
      },
      boxShadow: {
        sharp: "2px 2px 0px #111316",
        "sharp-sand": "2px 2px 0px #D8D4CA",
        "sharp-accent": "2px 2px 0px #E57E25",
      },
      fontFamily: {
        editorial: ['"Libre Baskerville"', '"Newsreader"', '"Lora"', 'Baskerville', '"Times New Roman"', 'serif'],
        serif: ['"Libre Baskerville"', '"Newsreader"', '"Lora"', 'Baskerville', '"Times New Roman"', 'serif'],
        helvetica: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        sans: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
