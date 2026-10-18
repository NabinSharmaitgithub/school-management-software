/** @type {import('tailwindcss').Config} */
module.exports = {
  // "class" strategy keeps the component's `dark:` variants inert (the app is light-only)
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design system: deep teal primary, light background, white cards
        primary: "#0F766E", // deep teal
        "primary-hover": "#115E59",
        "primary-light": "#CCFBF1",
        secondary: "#14B8A6",
        tertiary: "#8B5CF6",
        "on-surface": "#0F172A",
        "on-surface-v2": "#334155",
        surface: "#FFFFFF",
        background: "#F8FAFC",
        error: "#DC2626",
        warning: "#F59E0B",
        success: "#10B981",
        rose: "#DC2626",
        amber: "#F59E0B",
        teal: "#14B8A6",
        // Slate grays for borders and muted text
        border: "#E2E8F0",
        "border-hover": "#CBD5E1",
        muted: "#64748B",
        "muted-bg": "#F1F5F9",
        // Tokens used by the animated sign-in component (CSS vars from globals.css)
        foreground: "hsl(var(--foreground))",
        skeleton: "var(--skeleton)",
      },
      borderRadius: {
        DEFAULT: "0.75rem",
        lg: "1rem",
        full: "9999px",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        headline: ["Inter", "sans-serif"],
        display: ["Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
        label: ["Inter", "sans-serif"],
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        card: "0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)",
        input:
          "0px 2px 3px -1px rgba(0, 0, 0, 0.1), 0px 1px 0px 0px rgba(25, 28, 33, 0.02), 0px 0px 0px 1px rgba(25, 28, 33, 0.08)",
      },
      animation: {
        ripple: "ripple 2s ease infinite",
        orbit: "orbit calc(var(--duration) * 1s) linear infinite",
      },
      keyframes: {
        ripple: {
          "0%, 100%": { transform: "translate(-50%, -50%) scale(1)" },
          "50%": { transform: "translate(-50%, -50%) scale(0.9)" },
        },
        orbit: {
          "0%": {
            transform:
              "rotate(0deg) translateY(calc(var(--radius) * 1px)) rotate(0deg)",
          },
          "100%": {
            transform:
              "rotate(360deg) translateY(calc(var(--radius) * 1px)) rotate(-360deg)",
          },
        },
      },
    },
  },
  plugins: [],
};
