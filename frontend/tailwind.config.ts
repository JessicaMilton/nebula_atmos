import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        mint: "#58E6C7",
        skyb: "#73BFF1"
      },
      backgroundImage: {
        "air-gradient": "linear-gradient(120deg, #73BFF1 0%, #58E6C7 100%)"
      }
    }
  },
  plugins: []
} satisfies Config;


