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
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}