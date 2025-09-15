import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        glass: 'rgba(10,18,26,0.45)'
      },
      screens: {
        landscape: { raw: '(orientation: landscape)' }
      }
    }
  },
  plugins: []
} satisfies Config;