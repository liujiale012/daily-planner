/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      keyframes: {
        'care-dialog-in': {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(8px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'task-complete-pop': {
          '0%': { transform: 'scale(1)' },
          '35%': { transform: 'scale(1.018)' },
          '65%': { transform: 'scale(0.995)' },
          '100%': { transform: 'scale(1)' },
        },
        'checkbox-spark': {
          '0%': { boxShadow: '0 0 0 0 rgba(244, 114, 182, 0.55)' },
          '70%': { boxShadow: '0 0 0 10px rgba(244, 114, 182, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(244, 114, 182, 0)' },
        },
      },
      animation: {
        'care-dialog-in': 'care-dialog-in 0.38s ease-out both',
        'task-complete-pop': 'task-complete-pop 0.55s cubic-bezier(0.34, 1.45, 0.64, 1)',
        'checkbox-spark': 'checkbox-spark 0.65s ease-out',
      },
    },
  },
  plugins: [],
};
