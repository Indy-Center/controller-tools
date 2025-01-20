import type { Config } from 'tailwindcss';
import colors from 'tailwindcss/colors';

export default {
	darkMode: 'selector',
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			colors: {
				// Base interface colors
				surface: {
					DEFAULT: colors.zinc[50], // Very light zinc for main background
					dark: colors.zinc[900],
					secondary: colors.zinc[100], // Slightly darker for cards/sections
					'dark-secondary': colors.zinc[800],
					tertiary: colors.zinc[200], // Even darker for elevated elements
					'dark-tertiary': colors.zinc[700]
				},
				// Text colors
				content: {
					DEFAULT: colors.zinc[900], // Almost black for primary text
					dark: colors.zinc[100],
					secondary: colors.zinc[700], // Muted text
					'dark-secondary': colors.zinc[300],
					tertiary: colors.zinc[500], // Most muted text
					'dark-tertiary': colors.zinc[400]
				},
				// Accent colors (using sky instead of blue/purple)
				accent: {
					DEFAULT: colors.purple[500], // Primary accent
					dark: colors.purple[400],
					secondary: colors.purple[600], // Slightly darker accent
					'dark-secondary': colors.purple[500],
					muted: colors.purple[200],
					'dark-muted': colors.purple[800]
				},
				// Action colors
				action: {
					primary: colors.sky[500],
					danger: colors.red[600],
					success: colors.green[600],
					warning: colors.amber[500]
				}
			}
		}
	}
} satisfies Config;
