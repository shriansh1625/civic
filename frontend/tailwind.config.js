/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        saffron: {
          50: '#fff8ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#FF6B00',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        navy: {
          50: '#f0f4ff',
          100: '#dde4f0',
          200: '#b3c2db',
          300: '#8a9fc6',
          400: '#5a73a7',
          500: '#1a2744',
          600: '#162038',
          700: '#0f172a',
          800: '#0a1026',
          900: '#060b1a',
        },
        civic: {
          dark: '#0f172a',
          darker: '#060b1a',
          accent: '#FF6B00',
          green: '#10b981',
          blue: '#3b82f6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'gradient-x': 'gradientX 3s ease infinite',
        'slide-in-up': 'slideInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-in-down': 'slideInDown 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'float': 'floatGentle 6s ease-in-out infinite',
        'shimmer': 'shimmerFlow 2s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        gradientX: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        slideInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.85)' },
          '60%': { opacity: '1', transform: 'scale(1.02)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        floatGentle: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmerFlow: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(255,107,0,0.15)' },
          '50%': { boxShadow: '0 0 30px rgba(255,107,0,0.3)' },
        },
      },
      backdropBlur: {
        xs: '2px',
        '3xl': '64px',
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(255, 107, 0, 0.15)',
        'glow': '0 0 20px rgba(255, 107, 0, 0.2)',
        'glow-lg': '0 0 40px rgba(255, 107, 0, 0.25)',
        'glow-xl': '0 0 60px rgba(255, 107, 0, 0.3)',
        'glow-emerald': '0 0 20px rgba(16, 185, 129, 0.2)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.2)',
        'glow-rose': '0 0 20px rgba(244, 63, 94, 0.2)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.2)',
        'inner-glow': 'inset 0 0 20px rgba(255, 107, 0, 0.06)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.04)',
        'card-hover': '0 12px 40px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 107, 0, 0.1)',
        'elevated': '0 20px 60px rgba(0, 0, 0, 0.35)',
        'cinematic': '0 25px 80px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        'cinematic-hover': '0 30px 100px rgba(0, 0, 0, 0.5), 0 0 60px rgba(255, 107, 0, 0.08)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      transitionTimingFunction: {
        'premium': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'bounce-out': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}
