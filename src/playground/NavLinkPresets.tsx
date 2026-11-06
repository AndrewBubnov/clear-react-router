import type { ReactNode } from 'react';
import { usePlaygroundSettings } from './usePlaygroundSettings';
import type { NavLinkAs } from './NavLinkAs';
import MuiButton from '@mui/material/Button';
import { Button } from '@mantine/core';

type Preset = {
	value: NavLinkAs;
	element: ReactNode;
	label: string;
};

const createNavLinkPresets = (naLinkAs: NavLinkAs): Preset[] => [
	{
		value: 'link',
		label: 'Plain <a> tag',
		element: (
			<a
				className={`pg-nav-link ${naLinkAs === 'link' ? 'pg-active-settings-link' : ''}`}
				style={{ textDecoration: 'none' }}
				tabIndex={-1}
				aria-current={naLinkAs === 'link' ? 'page' : undefined}
			>
				Example
			</a>
		),
	},
	{
		value: 'mui',
		label: 'MUI button',
		element: (
			<MuiButton
				variant={naLinkAs === 'mui' ? 'contained' : 'text'}
				size="small"
				component="a"
				style={{ textDecoration: 'none' }}
				tabIndex={-1}
				aria-current={naLinkAs === 'mui' ? 'page' : undefined}
			>
				Example
			</MuiButton>
		),
	},
	{
		value: 'mantine',
		label: 'Mantine button',
		element: (
			<Button
				component="a"
				variant={naLinkAs === 'mantine' ? 'gradient' : 'subtle'}
				size="compact-md"
				gradient={{ from: 'teal', to: 'blue', deg: 60 }}
				style={{ textDecoration: 'none' }}
				tabIndex={-1}
				aria-current={naLinkAs === 'mantine' ? 'page' : undefined}
			>
				Example
			</Button>
		),
	},
];

const NavLinkPresets = () => {
	const { navLinkAs, setNavLinkAs } = usePlaygroundSettings();
	return (
		<div className="pg-nav-presets">
			{createNavLinkPresets(navLinkAs).map(({ value, label }) => (
				<div key={`${value}-label`}>
					<label key={value} className={`pg-radio ${navLinkAs === value ? 'pg-radio-active-label' : ''}`}>
						<input
							className="pg-nav-preview-input"
							type="radio"
							name="nav-link-as"
							checked={navLinkAs === value}
							onChange={() => setNavLinkAs(value)}
						/>
						{label}
					</label>
				</div>
			))}
			{createNavLinkPresets(navLinkAs).map(({ value, element }) => (
				<div key={`${value}-el`} aria-hidden="true" onClick={() => setNavLinkAs(value)}>
					{element}
				</div>
			))}
		</div>
	);
};

export default NavLinkPresets;
