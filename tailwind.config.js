/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Editorial Textile Heritage — Pringgasela South Digital Museum
        ivory: '#F3EEE5',
        aged: '#E9DFD0',
        parchment: '#E6D9C6',
        terracotta: {
          DEFAULT: '#984323',
          hover: '#71321D',
          deep: '#71321D',
          light: '#F5EAE3',
        },
        indigoTextile: '#243A4A',
        charcoal: '#25221F',
        naturalBeige: '#C9B69C',
        mutedBrown: '#806B58',
        softLinen: '#D9CCB9',

        // Semantic compatibility tokens for public pages & Admin CMS
        background: '#F3EEE5',
        surface: '#FBF8F3',
        text: '#25221F',
        primary: {
          DEFAULT: '#984323',
          hover: '#71321D',
          light: '#EFE4DA',
        },
        secondary: {
          DEFAULT: '#806B58',
          hover: '#665343',
          light: '#F3EEE5',
        },
        accent: {
          DEFAULT: '#984323',
          hover: '#71321D',
          light: '#F5EAE3',
        },
        sand: {
          50: '#FAF7F2',
          100: '#F3EEE5',
          200: '#E9DFD0',
          300: '#E6D9C6',
          400: '#D9CCB9',
          500: '#C9B69C',
          600: '#806B58',
          700: '#5C4D40',
          800: '#3B342E',
          900: '#25221F',
        },
        border: {
          DEFAULT: '#D9CCB9',
          dark: '#C9B69C',
        },
        muted: {
          DEFAULT: '#6E5C4E',
          light: '#806B58',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
