/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Syne', 'sans-serif'],
      },
      colors: {
        surface: {
          DEFAULT: '#0d0f14',
          1: '#13161e',
          2: '#191d27',
          3: '#1f2433',
        },
        border: {
          DEFAULT: '#252a38',
          subtle: '#1d2230',
        },
        accent: {
          DEFAULT: '#4f8ef7',
          hover: '#6ba3ff',
          muted: 'rgba(79,142,247,0.12)',
        },
        success: '#34d399',
        warning: '#fbbf24',
        danger: '#f87171',
        text: {
          primary: '#e8ecf4',
          secondary: '#8892a4',
          muted: '#50586a',
        },
      },
    },
  },
  plugins: [],
}
