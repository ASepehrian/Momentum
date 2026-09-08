import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        base: "#0B0E14",
        panel: "#12161F",
        panel2: "#171C27",
        line: "#232936",
        ink: "#E7EAF0",
        mute: "#7C8494",
        accent: "#C8FF4D",
        up: "#33D6A6",
        down: "#FF5C7A",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "'Vazirmatn'",
          "Tahoma",
          "sans-serif",
        ],
        mono: ["'JetBrains Mono'", "'SF Mono'", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
