import { Button, createTheme, Slider, Switch } from '@mantine/core';

const BACKGROUND = 'light-dark(var(--mantine-color-brand-6), var(--mantine-color-brand-9))';
const COLOR = 'light-dark(var(--mantine-color-brand-2), var(--mantine-color-brand-3))';

export const theme = createTheme({
	primaryColor: 'brand',
	primaryShade: { light: 6, dark: 4 },
	fontFamily: "'Geist Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
	fontFamilyMonospace: "'Geist Mono Variable', ui-monospace, 'Cascadia Code', Consolas, monospace",
	headings: {
		fontFamily: "'Geist Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
		fontWeight: '640',
	},
	defaultRadius: 'lg',
	colors: {
		brand: [
			'#eef2ff',
			'#e0e7ff',
			'#c7d2fe',
			'#a5b4fc',
			'#818cf8',
			'#6366f1',
			'#3c46c9',
			'#4338ca',
			'#3730a3',
			'#312e81',
		],
	},
	components: {
		Switch: Switch.extend({
			defaultProps: {
				color: BACKGROUND,
			},
		}),
		Slider: Slider.extend({
			styles: {
				thumb: {
					backgroundColor: BACKGROUND,
					border: BACKGROUND,
				},
				bar: {
					backgroundColor: BACKGROUND,
				},
				label: {
					backgroundColor: BACKGROUND,
					color: COLOR,
					pointerEvents: 'all',
					cursor: 'grab',
				},
				root: {
					width: 200,
				},
			},
		}),
		Button: Button.extend({
			styles: (_theme, { disabled, loading }) => ({
				root: disabled || loading ? {} : { backgroundColor: BACKGROUND, color: COLOR },
			}),
		}),
	},
});
