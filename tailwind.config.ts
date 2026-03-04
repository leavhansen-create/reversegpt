import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      keyframes: {
        'cursor-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'dots': {
          '0%, 80%, 100%': { opacity: '0', transform: 'scale(0.6)' },
          '40%': { opacity: '1', transform: 'scale(1)' },
        },
        'voice-wave': {
          '0%, 100%': { height: '4px' },
          '50%': { height: '14px' },
        },
        'voice-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.5' },
          '100%': { transform: 'scale(1.7)', opacity: '0' },
        },
      },
      animation: {
        'cursor-blink': 'cursor-blink 0.8s ease infinite',
        'dots': 'dots 1.2s ease-in-out infinite',
        'voice-wave': 'voice-wave 0.7s ease-in-out infinite',
        'voice-ring': 'voice-ring 1.3s ease-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
