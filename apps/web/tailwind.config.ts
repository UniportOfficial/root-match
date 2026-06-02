import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-noto-sans-kr)', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#2563eb',
          hover: '#1d4ed8',
          light: '#dbeafe',
        },
        ink: {
          950: '#0f172a',
          700: '#475569',
          400: '#94a3b8',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f8fafc',
        },
        border: {
          DEFAULT: '#e2e8f0',
          subtle: '#f1f5f9',
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
      },
    },
  },
  plugins: [],
}

export default config
