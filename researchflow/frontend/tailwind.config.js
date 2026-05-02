/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        workspace: '#0a0a0a',
        sidebar:   '#020202',
        accent:    '#10b981',
        panel:     '#18181b',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 500ms ease-in-out',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
  fontFamily: {
  sans: ['Satoshi', 'Inter', 'system-ui', 'sans-serif'],
}
}