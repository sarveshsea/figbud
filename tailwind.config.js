/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // FigBud Dark Theme Colors
        figbud: {
          bg: 'transparent',
          'bg-secondary': 'rgba(45, 45, 45, 0.6)',
          'bg-tertiary': 'rgba(58, 58, 58, 0.5)',
          'bg-hover': 'rgba(64, 64, 64, 0.4)',
          text: 'rgba(255, 255, 255, 0.95)',
          'text-secondary': 'rgba(255, 255, 255, 0.8)',
          'text-tertiary': 'rgba(255, 255, 255, 0.6)',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-hover': 'rgba(255, 255, 255, 0.12)',
          green: 'rgba(76, 175, 80, 0.9)',
          'green-hover': 'rgba(69, 160, 73, 0.9)',
          orange: 'rgba(255, 152, 0, 0.9)',
          'orange-hover': 'rgba(245, 124, 0, 0.9)',
          'user-bubble': 'rgba(245, 245, 245, 0.1)',
          'ai-bubble': 'rgba(45, 45, 45, 0.05)',
          'accent': 'rgba(33, 150, 243, 0.9)',
          'card-hover': 'rgba(255, 255, 255, 0.06)',
        },
        pixel: {
          'frog-green': '#4CAF50',
          'frog-dark': '#388E3C',
          'frog-light': '#66BB6A',
          'neon-cyan': '#00FFFF',
          'neon-pink': '#FF00FF',
          'matrix-green': '#00FF00',
          'glow-white': '#FFFFFF',
        }
      },
      fontFamily: {
        inter: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'heading': ['18px', { fontWeight: '700' }],
        'body': ['14px', { fontWeight: '400' }],
        'caption': ['12px', { fontWeight: '400' }],
      },
      spacing: {
        'card': '16px',
        'element': '8px',
        'bubble': '12px',
      },
      borderRadius: {
        'window': '8px',
        'bubble': '8px',
        'bud': '50%',
      },
      animation: {
        'resize': 'resize 200ms ease-in',
        'minimize': 'minimize 300ms ease-out',
        'maximize': 'maximize 300ms ease-in',
        'hover-button': 'hover-button 100ms ease',
      },
      keyframes: {
        resize: {
          '0%': { transform: 'scale(0.98)', opacity: '0.8' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        minimize: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0)', opacity: '0' },
        },
        maximize: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'hover-button': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0.8' },
        },
      },
      minWidth: {
        'chat': '300px',
      },
      maxWidth: {
        'chat': '600px',
      },
      minHeight: {
        'chat': '400px',
      },
      maxHeight: {
        'chat': '800px',
      },
    },
  },
  plugins: [],
}