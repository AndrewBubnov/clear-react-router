import { useState, type ReactNode } from 'react';
import { Link } from '../clear-router';
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

const STORAGE_KEY = 'mantine-color-scheme-value';

const applyScheme = (next: 'light' | 'dark') => {
	window.localStorage.setItem(STORAGE_KEY, next);
	// The browser fires `storage` events only in other tabs, but MantineProvider's
	// manager listens for them — dispatch one so the provider (and its attribute)
	// stays in sync on this tab too.
	window.dispatchEvent(
		new StorageEvent('storage', { key: STORAGE_KEY, newValue: next, storageArea: window.localStorage })
	);
};

const ThemeToggle = () => {
	const [scheme, setScheme] = useState<'auto' | 'light' | 'dark'>(() => {
		const stored = window.localStorage.getItem(STORAGE_KEY);
		return stored === 'light' || stored === 'dark' || stored === 'auto' ? stored : 'auto';
	});
	const dark = scheme === 'dark' || (scheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
	const label = `Switch to ${dark ? 'light' : 'dark'} theme`;
	return (
		<button
			type="button"
			className="pg-icon-button"
			onClick={() => {
				const next = dark ? 'light' : 'dark';
				setScheme(next);
				applyScheme(next);
			}}
			aria-label={label}
		>
			{dark ? <SunIcon size={19} /> : <MoonIcon size={19} />}
		</button>
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
					<button
						type="button"
						role="switch"
						aria-checked={showCacheVisualizer}
						aria-label="visualize cache"
						className="pg-cache-switch pg-switch"
						onClick={() => setShowCacheVisualizer(!showCacheVisualizer)}
					>
						<span className="pg-switch-track" aria-hidden="true">
							<span className="pg-switch-thumb" />
						</span>
						<span className="pg-switch-label">visualize cache</span>
					</button>
					<ThemeToggle />
					<Link to="/playground/settings" aria-label="Settings" className="pg-gear-link pg-icon-button">
						<SettingsIcon size={19} aria-hidden="true" />
					</Link>
					<button
						type="button"
						className="pg-menu-toggle pg-icon-button"
						onClick={() => setMenuOpen(open => !open)}
						aria-label={menuLabel}
						aria-expanded={menuOpen}
						aria-controls="pg-nav"
					>
						{menuOpen ? <XIcon size={19} /> : <MenuIcon size={19} />}
					</button>
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
