import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					light: 'hsl(var(--primary-light))',
					glow: 'hsl(var(--primary-glow))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				/* John Deere inspired colors */
				'jd-green': '#1E6F41',
				'jd-yellow': '#F9DD30',
				'jd-green-light': '#2D8F5A',
				'jd-green-dark': '#155A33',
				'jd-yellow-light': '#FCEA5A',
				'jd-yellow-dark': '#E6C700',
				/* Thai farmer friendly colors */
				'thai-green': '#2D5016',
				'thai-gold': '#D4AF37',
				'thai-red': '#B22222',
				'thai-blue': '#0066CC',
				/* Agricultural status colors */
				healthy: {
					DEFAULT: 'hsl(var(--healthy))',
					foreground: 'hsl(var(--healthy-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				disease: {
					DEFAULT: 'hsl(var(--disease))',
					foreground: 'hsl(var(--disease-foreground))'
				},
				spray: {
					good: 'hsl(var(--spray-good))',
					caution: 'hsl(var(--spray-caution))',
					stop: 'hsl(var(--spray-stop))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			fontFamily: {
				'thai': ['Kanit', 'Prompt', 'Sarabun', 'sans-serif'],
				'deere': ['Arial', 'Helvetica', 'sans-serif'],
			},
			fontSize: {
				'farmer-xs': ['0.875rem', { lineHeight: '1.25rem' }],
				'farmer-sm': ['1rem', { lineHeight: '1.5rem' }],
				'farmer-base': ['1.125rem', { lineHeight: '1.75rem' }],
				'farmer-lg': ['1.25rem', { lineHeight: '1.75rem' }],
				'farmer-xl': ['1.5rem', { lineHeight: '2rem' }],
				'farmer-2xl': ['1.875rem', { lineHeight: '2.25rem' }],
				'farmer-3xl': ['2.25rem', { lineHeight: '2.5rem' }],
				'farmer-4xl': ['3rem', { lineHeight: '1' }],
				'farmer-5xl': ['3.75rem', { lineHeight: '1' }],
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
