/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#007BFF',
        'primary-hover': '#0069d9',
        'primary-light': '#E7F1FF',
        'bg-white': '#FFFFFF',
        'bg-gray': '#F8F9FA',
        'border-gray': '#EDEDED',
        'text-primary': '#212529',
        'text-secondary': '#6C757D',
        'text-muted': '#ADB5BD',
        overdue: '#FF4D4F',
      },
    },
  },
  plugins: [],
};
