import { useState, type ReactNode } from 'react';
import { Link } from '../clear-router';
import { ActionIcon, Switch, useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import { MenuIcon, MoonIcon, RouteIcon, SettingsIcon, SunIcon, XIcon } from '@animateicons/react/lucide';
import { usePlaygroundSettings } from './usePlaygroundSettings';
import { NAV_LINK_AS } from './NavLinkAs';

const NavLink = ({ to, exact, children }: { to: string; exact?: boolean; children: ReactNode }) => {
	const { navLinkAs } = usePlaygroundSettings();
	return (
		<Link
			to={to}
			exact={exact}
			as={NAV_LINK_AS[navLinkAs]}
			className={navLinkAs === 'link' ? 'pg-nav-link' : ''}
			activeClassName={navLinkAs === 'link' ? 'active-link' : ''}
		>
			{children}
		</Link>
	);
};

const ThemeToggle = () => {
	const { setColorScheme } = useMantineColorScheme();
	const computed = useComputedColorScheme('light');
	const dark = computed === 'dark';
	const label = `Switch to ${dark ? 'light' : 'dark'} theme`;
	return (
		<ActionIcon
			className="pg-icon-button"
			variant="default"
			size="lg"
			radius="xl"
			onClick={() => setColorScheme(dark ? 'light' : 'dark')}
			aria-label={label}
		>
			{dark ? <SunIcon size={19} /> : <MoonIcon size={19} />}
		</ActionIcon>
	);
};

export const PlaygroundNav = () => {
	const { showCacheVisualizer, setShowCacheVisualizer } = usePlaygroundSettings();
	const [menuOpen, setMenuOpen] = useState(false);
	const menuLabel = menuOpen ? 'Close navigation menu' : 'Open navigation menu';
	return (
		<header className="pg-header">
			<div className="pg-brand-wrap">
				<a
					className="pg-brand-link"
					href="https://www.npmjs.com/package/clear-react-router"
					target="_blank"
					rel="noopener noreferrer"
					aria-label="Clear Router playground — npm package (opens in new tab)"
				>
					<span className="pg-brand-mark" aria-hidden="true">
						<RouteIcon size={20} />
					</span>
					<span className="pg-brand-copy">
						<span className="pg-brand">Clear React Router</span>
						<span className="pg-brand-tag">playground</span>
					</span>
				</a>
				<div className="pg-brand-controls">
					<Switch
						className="pg-cache-switch"
						size="xs"
						label="visualize cache"
						aria-label="visualize cache"
						checked={showCacheVisualizer}
						onChange={e => setShowCacheVisualizer(e.currentTarget.checked)}
						styles={{ label: { lineHeight: 1.2 } }}
					/>
					<ThemeToggle />
					<Link to="/playground/settings" aria-label="Settings" className="pg-gear-link pg-icon-button">
						<SettingsIcon size={19} aria-hidden="true" />
					</Link>
					<ActionIcon
						className="pg-menu-toggle pg-icon-button"
						variant="default"
						size="lg"
						radius="xl"
						onClick={() => setMenuOpen(open => !open)}
						aria-label={menuLabel}
						aria-expanded={menuOpen}
						aria-controls="pg-nav"
					>
						{menuOpen ? <XIcon size={19} /> : <MenuIcon size={19} />}
					</ActionIcon>
				</div>
			</div>
			<div className="pg-nav-row">
				<nav
					id="pg-nav"
					className={`pg-nav${menuOpen ? ' is-open' : ''}`}
					aria-label="Playground"
					onClick={event => {
						if ((event.target as HTMLElement).closest('a')) setMenuOpen(false);
					}}
				>
					<NavLink to="/playground" exact>
						Home
					</NavLink>
					<NavLink to="/playground/cache" exact>
						Cache
					</NavLink>
					<NavLink to="/playground/retry">Retry</NavLink>
					<NavLink to="/playground/retry-raw">No-retry</NavLink>
					<NavLink to="/playground/actions">Actions</NavLink>
					<NavLink to="/playground/blocker">Blocker</NavLink>
					<NavLink to="/playground/prefetch">Prefetch</NavLink>
					<NavLink to="/playground/optimistic">Optimistic</NavLink>
					<NavLink to="/playground/deferred">Deferred</NavLink>
					<NavLink to="/playground/guard">Guards</NavLink>
					<NavLink to="/playground/nest">Nested</NavLink>
					<NavLink to="/playground/live">Live</NavLink>
					<NavLink to="/playground/scroll">Scroll</NavLink>
					<NavLink to="/playground/cache/external/CLR">External cache</NavLink>
					<NavLink to="/playground/search">Search</NavLink>
				</nav>
			</div>
		</header>
	);
};
