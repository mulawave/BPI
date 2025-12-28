import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // ShadCN UI colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        // BPI Brand Colors from Index Page
        // BPI Image-based palette: lighter forest green dominance with subtle yellow accents
        'bpi-primary': '#2d7a4f',     // Lighter, more vibrant forest green
        'bpi-secondary': '#f4d03f',   // Softer golden yellow (less bright)
        'bpi-accent': '#52a86b',      // Fresh medium green
        'bpi-light-green': '#e8f5f0', // Very light green tint
        'bpi-light-yellow': '#fffbf0', // Very light yellow tint
        'bpi-neutral': '#f8f9fa',     // Clean light gray
        'bpi-white': '#ffffff',       // Pure white
        'bpi-border': '#d4e6db',      // Light green-tinted border
        // Dark theme colors - deeper, richer variants
        'bpi-dark-bg': '#07110cff',     // Dark forest green (not too dark)
        'bpi-dark-card': '#1d362aff',   // Dark green card background
        'bpi-dark-accent': '#4a7c59', // Medium dark green accent
        'bpi-dark-text': '#e8f2ed',   // Light green-tinted text
        'bpi-dark-muted': '#6b8471',  // Muted green for secondary text
        'bpi-dark-border': '#3d6b4a', // Dark green border
      },
      backgroundImage: {
        // BPI gradients with lighter, more balanced green dominance
        'bpi-gradient-light': 'linear-gradient(135deg, #e8f5f0 0%, #fffbf0 50%, #f8f9fa 100%)',
        'bpi-gradient-dark': 'linear-gradient(135deg, #0b1912ff 0%, #13261dff 50%, #1c3925ff 100%)',
        // Primary gradient: lighter forest green dominant with subtle gold accent
        'bpi-gradient-primary': 'linear-gradient(135deg, #2d7a4f 0%, #52a86b 50%, #7bc896 80%, #f4d03f 100%)',
        'bpi-gradient-card': 'linear-gradient(135deg, #ffffff 0%, #e8f5f0 100%)',
        'bpi-gradient-card-dark': 'linear-gradient(135deg, #2d5f47 0%, #4a7c59 100%)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      fontFamily: {
        sans: ["Inter", ...fontFamily.sans]
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};
export default config;
