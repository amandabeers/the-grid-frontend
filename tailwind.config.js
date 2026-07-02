/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        field: '#0D1117',
        surface: '#161C23',
        border: '#2A3340',
        chalk: {
          DEFAULT: '#F0EDE6',
          muted: '#7A8694',
        },
        signal: '#E8C547',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
