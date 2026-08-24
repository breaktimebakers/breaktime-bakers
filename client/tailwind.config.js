/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        crust: '#F7EFE2',
        espresso: '#3B2A21',
        'oven-amber': '#C97A2B',
        'cherry-compote': '#A83A3A',
        'proof-cream': '#FFFBF3',
        'matcha-glaze': '#6B8A5C',
        sourdough: '#E8D5B7',
        'olive-herb': '#8C9A6B',
        'berry-jam': '#7A4A5C',
        'toasted-sesame': '#D4A24C',
        'sage-dust': '#B5C4A8',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        bakery: '10px',
      },
      boxShadow: {
        bakery: '0 2px 8px -2px rgba(59, 42, 33, 0.12), 0 1px 3px -1px rgba(59, 42, 33, 0.08)',
        'bakery-lg': '0 12px 32px -8px rgba(59, 42, 33, 0.22), 0 4px 12px -4px rgba(59, 42, 33, 0.12)',
      },
      keyframes: {
        flash: {
          '0%, 100%': { backgroundColor: 'rgba(107, 138, 92, 0)' },
          '30%': { backgroundColor: 'rgba(107, 138, 92, 0.28)' },
        },
        'flash-amber': {
          '0%, 100%': { backgroundColor: 'rgba(201, 122, 43, 0)' },
          '30%': { backgroundColor: 'rgba(201, 122, 43, 0.28)' },
        },
        'slide-in': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96) translateY(8px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'toast-in': {
          from: { transform: 'translateX(115%) scale(0.96)', opacity: '0' },
          to: { transform: 'translateX(0) scale(1)', opacity: '1' },
        },
        'toast-out': {
          from: { transform: 'translateX(0) scale(1)', opacity: '1', maxHeight: '80px', marginBottom: '10px' },
          to: { transform: 'translateX(115%) scale(0.96)', opacity: '0', maxHeight: '0px', marginBottom: '0px' },
        },
        'toast-progress': {
          from: { transform: 'scaleX(1)' },
          to: { transform: 'scaleX(0)' },
        },
      },
      animation: {
        flash: 'flash 1.4s ease-out',
        'flash-amber': 'flash-amber 1.4s ease-out',
        'slide-in': 'slide-in 0.28s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slide-up 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        'toast-in': 'toast-in 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
        'toast-out': 'toast-out 0.32s cubic-bezier(0.4, 0, 1, 1) forwards',
        'toast-progress': 'toast-progress 3.2s linear forwards',
      },
    },
  },
  plugins: [],
}
