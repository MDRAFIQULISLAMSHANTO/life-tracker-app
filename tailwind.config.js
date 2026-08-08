/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        crimson: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        },
        violet: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
        sea: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        // Theme-aware aliases — these used to be hardcoded light-mode hex
        // values, which is why anything using them broke in dark mode.
        primary: {
          DEFAULT: 'var(--accent)',
          600: 'var(--accent)',
        },
        text: {
          primary: 'var(--text-1)',
          secondary: 'var(--text-2)',
        },
        background: {
          DEFAULT: 'var(--bg)',
          card: 'var(--card-bg)',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'glow-red': '0 0 40px rgba(239,68,68,0.15), 0 0 80px rgba(239,68,68,0.05)',
        'glow-violet': '0 0 40px rgba(139,92,246,0.12)',
        'glass': '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
        'glass-dark': '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glass-lg': '0 18px 50px -20px rgba(15,23,42,0.14), inset 0 1px 0 rgba(255,255,255,0.55)',
        'card': '0 4px 24px rgba(0,0,0,0.06)',
        'fab': '0 8px 24px rgba(239,68,68,0.35)',
        'dock': '0 8px 32px rgba(0,0,0,0.12)',
        'soft': '0 1px 3px 0 rgba(0,0,0,0.1)',
      },
      backgroundImage: {
        'light-base': 'linear-gradient(135deg, #fef2f2 0%, #eef2ff 50%, #f0fdf4 100%)',
        'dark-base': 'radial-gradient(ellipse at top left, #1a0810 0%, #09090f 40%, #080d1a 100%)',
        'hero-dark': 'linear-gradient(135deg, #1f0a0a 0%, #2d0f0f 40%, #1a0a18 100%)',
        'hero-light': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
        'income-grad': 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        'expense-grad': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        'dashboard-ios': 'linear-gradient(135deg, #fef2f2 0%, #eef2ff 50%, #f0fdf4 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
        'gradient-x': 'gradient-x 8s ease infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        }
      }
    },
  },
  plugins: [],
}
