import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        hc: {
          red: '#ec3750',
          orange: '#ff8c37',
          yellow: '#f1c40f',
          green: '#33d6a6',
          cyan: '#5bc0de',
          blue: '#338eda',
          purple: '#a633d6',
          muted: '#8492a6'
        }
      }
    }
  },
  plugins: [typography]
};
