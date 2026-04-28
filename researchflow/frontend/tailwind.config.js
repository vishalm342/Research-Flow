/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        workspace: '#1e293b',
        sidebar:   '#0f172a',
        accent:    '#6366f1',
        panel:     '#334155',
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