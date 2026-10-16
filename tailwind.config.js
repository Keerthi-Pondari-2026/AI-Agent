/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0f1729',
          muted: '#3d4a66',
          soft: '#64748b',
        },
        lavender: {
          50: '#f8f6ff',
          100: '#efe9ff',
          200: '#ddd4ff',
          300: '#c4b5fd',
          400: '#a78bfa',
        },
        accent: {
          purple: '#7c3aed',
          violet: '#8b5cf6',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 23, 41, 0.06), 0 8px 24px rgba(124, 58, 237, 0.08)',
        glow: '0 0 0 1px rgba(167, 139, 250, 0.2), 0 12px 40px rgba(124, 58, 237, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.45s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
