/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-mint': '#E6F4EA',
        'brand-moss': '#2E5339',
        'brand-emerald': '#10B981',
        'brand-cream': '#FDFBF7',
      },
      fontFamily: {
        'sketch': ['Kalam', 'cursive'],
        'sans': ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'sketch': '4px 4px 0px 0px rgba(16, 185, 129, 1)', // emerald
        'sketch-sm': '2px 2px 0px 0px rgba(16, 185, 129, 1)',
        'sketch-black': '4px 4px 0px 0px rgba(0, 0, 0, 1)',
        'sketch-black-sm': '2px 2px 0px 0px rgba(0, 0, 0, 1)',
      }
    },
  },
  plugins: [],
}
