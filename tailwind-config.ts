import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Trading specific colors
        success: {
          DEFAULT: 'hsl(var(--success))',
          light: 'hsl(var(--success-light))',
          dark: 'hsl(var(--success-dark))',
        },
        danger: {
          DEFAULT: 'hsl(var(--danger))',
          light: 'hsl(var(--danger-light))',
          dark: 'hsl(var(--danger-dark))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          light: 'hsl(var(--warning-light))',
          dark: 'hsl(var(--warning-dark))',
        },
        // Market colors
        bull: {
          DEFAULT: 'hsl(var(--bull))',
          50: 'hsl(var(--bull-50))',
          100: 'hsl(var(--bull-100))',
          500: 'hsl(var(--bull-500))',
          600: 'hsl(var(--bull-600))',
          700: 'hsl(var(--bull-700))',
        },
        bear: {
          DEFAULT: 'hsl(var(--bear))',
          50: 'hsl(var(--bear-50))',
          100: 'hsl(var(--bear-100))',
          500: 'hsl(var(--bear-500))',
          600: 'hsl(var(--bear-600))',
          700: 'hsl(var(--bear-700))',
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-out': {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        'slide-in-from-top': {
          from: { transform: 'translateY(-100%)' },
          to: { transform: 'translateY(0)' },
        },
        'slide-in-from-bottom': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'slide-in-from-left': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-in-from-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'bounce-in': {
          '0%': {
            transform: 'scale(0.3)',
            opacity: '0',
          },
          '50%': {
            transform: 'scale(1.05)',
          },
          '70%': {
            transform: 'scale(0.9)',
          },
          '100%': {
            transform: 'scale(1)',
            opacity: '1',
          },
        },
        'pulse-success': {
          '0%, 100%': {
            backgroundColor: 'rgb(34 197 94 / 0.1)',
          },
          '50%': {
            backgroundColor: 'rgb(34 197 94 / 0.3)',
          },
        },
        'pulse-danger': {
          '0%, 100%': {
            backgroundColor: 'rgb(239 68 68 / 0.1)',
          },
          '50%': {
            backgroundColor: 'rgb(239 68 68 / 0.3)',
          },
        },
        'shimmer': {
          '0%': {
            backgroundPosition: '-468px 0',
          },
          '100%': {
            backgroundPosition: '468px 0',
          },
        },
        'price-up': {
          '0%': {
            color: 'rgb(34 197 94)',
            transform: 'scale(1)',
          },
          '50%': {
            color: 'rgb(34 197 94)',
            transform: 'scale(1.02)',
            backgroundColor: 'rgb(34 197 94 / 0.1)',
          },
          '100%': {
            color: 'rgb(34 197 94)',
            transform: 'scale(1)',
          },
        },
        'price-down': {
          '0%': {
            color: 'rgb(239 68 68)',
            transform: 'scale(1)',
          },
          '50%': {
            color: 'rgb(239 68 68)',
            transform: 'scale(1.02)',
            backgroundColor: 'rgb(239 68 68 / 0.1)',
          },
          '100%': {
            color: 'rgb(239 68 68)',
            transform: 'scale(1)',
          },
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-out': 'fade-out 0.2s ease-out',
        'slide-in-from-top': 'slide-in-from-top 0.3s ease-out',
        'slide-in-from-bottom': 'slide-in-from-bottom 0.3s ease-out',
        'slide-in-from-left': 'slide-in-from-left 0.3s ease-out',
        'slide-in-from-right': 'slide-in-from-right 0.3s ease-out',
        'bounce-in': 'bounce-in 0.6s ease-out',
        'pulse-success': 'pulse-success 2s ease-in-out infinite',
        'pulse-danger': 'pulse-danger 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'price-up': 'price-up 1s ease-out',
        'price-down': 'price-down 1s ease-out',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'grid-pattern': 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
        'shimmer-gradient': 'linear-gradient(90deg, #f6f7f8 0%, #edeef1 20%, #f6f7f8 40%, #f6f7f8 100%)',
      },
      backgroundSize: {
        'grid-pattern': '20px 20px',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'hsl(var(--foreground))',
            a: {
              color: 'hsl(var(--primary))',
              '&:hover': {
                color: 'hsl(var(--primary))',
              },
            },
          },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      screens: {
        'xs': '475px',
        '3xl': '1600px',
      },
      aspectRatio: {
        'card': '16 / 10',
        'video': '16 / 9',
      }
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config

export default config