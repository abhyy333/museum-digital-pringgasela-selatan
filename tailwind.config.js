/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark Indigo Heritage Palette
        indigo: {
          deep: '#101D2B',
          midnight: '#0B1623',
          textile: '#17283A',
          card: '#0E1A27',
          surface: '#132334',
          border: '#1E3246',
        },
        terracotta: {
          DEFAULT: '#B95735',
          hover: '#A34828',
          burnt: '#C66A42',
          copper: '#A95B3D',
          muted: '#8A4126',
          light: '#2E1C18',
        },
        heritage: {
          ivory: '#F2E9DC',
          cream: '#E8DCC9',
          beige: '#B9A993',
          white: '#F8F5EF',
          muted: '#8D9CAE',
          sand: '#C5B6A0',
        },
        // Semantic mappings for compatibility across views
        background: '#0B1623',
        surface: '#101D2B',
        text: '#F2E9DC',
        primary: {
          DEFAULT: '#B95735',
          hover: '#A34828',
          light: '#1E3246',
        },
        secondary: {
          DEFAULT: '#C66A42',
          hover: '#A95B3D',
          light: '#17283A',
        },
        accent: {
          DEFAULT: '#B95735',
          hover: '#C66A42',
          light: '#2E1C18',
        },
        border: {
          DEFAULT: '#1E3246',
          dark: '#132334',
          light: '#27425C',
        },
        muted: {
          DEFAULT: '#8D9CAE',
          light: '#B0C0D2',
        },
        sand: {
          50: '#132334',
          100: '#101D2B',
          200: '#17283A',
          300: '#1E3246',
          400: '#8D9CAE',
          500: '#B9A993',
          600: '#C5B6A0',
          700: '#E8DCC9',
          800: '#F2E9DC',
          900: '#F8F5EF',
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