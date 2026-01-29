/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        surface: '#121212',
        surfaceHighlight: '#1E1E1E',
        primary: '#3b82f6', // Bright Blue
        success: '#10b981', // Emerald
        warning: '#f59e0b', // Amber
        error: '#ef4444', // Red
        text: '#f3f4f6',
        textMuted: '#9ca3af',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
