/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        espresso: '#3A2118',
        'dark-brown': '#542F20',
        'warm-brown': '#795548',
        caramel: '#A47551',
        terracotta: '#A65D43',
        cream: '#F5EFE6',
        'warm-beige': '#E8DCCB',
        'off-white': '#FBF8F3',
        'dark-text': '#2B211C',
        // Semantic aliases
        brand: {
          50: '#FBF8F3',
          100: '#F5EFE6',
          200: '#E8DCCB',
          300: '#D4C2AB',
          400: '#A47551',
          500: '#795548',
          600: '#542F20',
          700: '#3A2118',
          800: '#2B211C',
          900: '#1D1512',
        },
        // Component library semantic bindings
        primary: {
          DEFAULT: '#542F20',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#F5EFE6',
          foreground: '#3A2118',
        },
        muted: {
          DEFAULT: '#F5EFE6',
          foreground: '#795548',
        },
        accent: {
          DEFAULT: '#E8DCCB',
          foreground: '#3A2118',
        },
        destructive: {
          DEFAULT: '#A65D43',
          foreground: '#FFFFFF',
        },
        border: '#E8DCCB',
        input: '#E8DCCB',
        ring: '#795548',
        background: '#FBF8F3',
        foreground: '#2B211C',
      },
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        '2xs': '0 1px 1px 0 rgba(58, 33, 24, 0.04)',
        xs: '0 1px 2px 0 rgba(58, 33, 24, 0.05)',
        subtle: '0 1px 2px 0 rgba(58, 33, 24, 0.05)',
        card: '0 1px 3px 0 rgba(58, 33, 24, 0.08), 0 1px 2px -1px rgba(58, 33, 24, 0.08)',
        modal: '0 10px 25px -5px rgba(58, 33, 24, 0.15), 0 8px 10px -6px rgba(58, 33, 24, 0.1)',
      },
      dropShadow: {
        '2xs': '0 1px 1px rgba(58, 33, 24, 0.08)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
      },
    },
  },
  plugins: [],
};
