import type { Config } from 'tailwindcss';
import colors, { blueGray } from 'tailwindcss/colors';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			colors: {
				primary: {
					light: colors.zinc[700], // Lighter primary color
					dark: colors.zinc[900] // Darker primary color
				},
				secondary: {
					light: colors.zinc[500], // Lighter secondary color
					dark: colors.zinc[900] // Darker secondary color
				},
				accent: {
					light: colors.zinc[300], // Light accent color
					dark: colors.zinc[500] // Dark accent color
				},
				bg: {
					light: colors.zinc[50], // Background for light mode
					dark: colors.zinc[800] // Background for dark mode
				},
				text: {
					light: colors.zinc[900], // Text for light mode
					dark: colors.zinc[50] // Text for dark mode
				},
				onPrimary: {
					light: colors.zinc[900], // Text for light mode
					dark: colors.zinc[50] // Text for dark mode
				},
				onSecondary: {
					light: colors.zinc[700], // Secondary text for light mode
					dark: colors.zinc[300] // Secondary text for dark mode
				},
				white: colors.zinc[50],
				black: colors.zinc[900]
			}
		}
	},

	class: {},

	plugins: []
} satisfies Config;
