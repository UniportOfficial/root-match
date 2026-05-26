/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Noto Sans KR', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
