/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6366F1",
        "primary-violet": "#8B5CF6",
        secondary: "#14B8A6",
        tertiary: "#8B5CF6",
        "on-surface": "#0F172A",
        surface: "#F8FAFC",
        background: "#EEF2FF",
        error: "#F43F5E",
        warning: "#F59E0B",
        success: "#10B981",
        rose: "#F43F5E",
        amber: "#F59E0B",
        teal: "#14B8A6",
      },
      borderRadius: {
        DEFAULT: "0.75rem",
        lg: "1.5rem",
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
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.20)",
        glow: "0 0 20px rgba(99, 102, 241, 0.35)",
        lift: "0 12px 32px rgba(31, 38, 135, 0.25)",
      },
      backdropBlur: {
        glass: "24px",
      },
    },
  },
  plugins: [],
};
