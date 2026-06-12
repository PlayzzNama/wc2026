/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tg: {
          bg: 'var(--tg-theme-bg-color, #0f0f0f)',
          'bg-secondary': 'var(--tg-theme-secondary-bg-color, #1a1a1a)',
          text: 'var(--tg-theme-text-color, #ffffff)',
          'text-secondary': 'var(--tg-theme-hint-color, #aaaaaa)',
          button: 'var(--tg-theme-button-color, #2481cc)',
          'button-text': 'var(--tg-theme-button-text-color, #ffffff)',
          link: 'var(--tg-theme-link-color, #2481cc)',
        }
      }
    },
  },
  plugins: [],
}
