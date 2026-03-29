/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5',
          50: '#EEF2FF',
          100: '#E0E7FF',
          500: '#4F46E5',
          600: '#4338CA',
          700: '#3730A3',
        },
        /* Sea / teal accent — glass highlights, chrome, stats */
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
        success: '#16A34A',
        warning: '#F59E0B',
        danger: '#DC2626',
        text: {
          primary: '#111827',
          secondary: '#6B7280',
        },
        background: {
          DEFAULT: '#F9FAFB',
          card: '#FFFFFF',
        },
      },
      borderRadius: {
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        'soft': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'glass': '0 12px 42px -14px rgba(15, 23, 42, 0.12)',
        'glass-lg':
          '0 18px 50px -20px rgba(15, 23, 42, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.55)',
        'dock': '0 10px 40px -12px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(13, 148, 136, 0.06)',
        'fab': '0 14px 38px -6px rgba(13, 148, 136, 0.42)',
      },
      backgroundImage: {
        'dashboard-ios':
          'linear-gradient(165deg, #d8e8e5 0%, #e4eaec 36%, #eef0f3 68%, #e6f0ed 100%)',
      },
    },
  },
  plugins: [],
}
