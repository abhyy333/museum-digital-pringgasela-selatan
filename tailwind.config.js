/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8F6F1',
        surface: '#FFFFFF',
        text: '#292722',
        primary: {
          DEFAULT: '#79543B',
          hover: '#664630',
          light: '#F2ECE7',
        },
        secondary: {
          DEFAULT: '#A47752',
          hover: '#8E6442',
          light: '#F8F3EE',
        },
        accent: {
          DEFAULT: '#B86B4B',
          hover: '#9D583B',
          light: '#FAEDE7',
        },
        sand: {
          50: '#FBF9F6',
          100: '#F8F6F1',
          200: '#EFEAE1',
          300: '#E4DCD0',
          400: '#C9BEAD',
          500: '#AFA28F',
          600: '#8A7C69',
          700: '#655A4B',
          800: '#433B30',
          900: '#292722',
        },
        border: {
          DEFAULT: '#E5DFD5',
          dark: '#D0C7B9',
        },
        muted: {
          DEFAULT: '#6E6A63',
          light: '#9E9990',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
