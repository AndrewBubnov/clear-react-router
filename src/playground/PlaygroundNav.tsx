import { Link } from '../clear-router';
import { usePlaygroundSettings } from './usePlaygroundSettings';
import { Switch } from './Switch';

export const PlaygroundNav = () => {
	const { isAnimated, setIsAnimated } = usePlaygroundSettings();
	return (
		<div>
			<div className="pg-brand-wrap">
				<a
					href="https://www.npmjs.com/package/clear-react-router"
					target="_blank"
					rel="noopener noreferrer"
					aria-label="Clear Router playground — npm package (opens in new tab)"
				>
					<div className="pg-brand">Clear Router playground</div>
				</a>
				<div className="pg-brand-controls">
					<Switch checked={isAnimated} onCheckedChange={setIsAnimated}>
						<span>animated</span>
					</Switch>
					<Link to="/playground/settings" aria-label="Settings" className="pg-gear-link">
						<svg
							className="pg-gear"
							viewBox="0 0 24 24"
							stroke="currentColor"
							fill="none"
							aria-hidden="true"
							focusable="false"
						>
							<path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.5-0.41 h-3.8c-0.27,0-0.46,0.17-0.5,0.41L9.2,5.35C8.61,5.59,8.08,5.91,7.58,6.29L5.19,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.68,8.87 c-0.11,0.21-0.06,0.47,0.12,0.61l2.03,1.58C4.78,11.36,4.76,11.68,4.76,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.5,0.41h3.8c0.27,0,0.46-0.17,0.5-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.11-0.22,0.06-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
						</svg>
					</Link>
				</div>
			</div>
			<nav className="pg-nav" aria-label="Playground">
				<Link to="/playground" exact>
					Home
				</Link>
				<Link to="/playground/cache">Cache</Link>
				<Link to="/playground/retry">Retry</Link>
				<Link to="/playground/retry-raw">No-retry</Link>
				<Link to="/playground/actions">Actions</Link>
				<Link to="/playground/blocker">Blocker</Link>
				<Link to="/playground/prefetch">Prefetch</Link>
				<Link to="/playground/optimistic">Optimistic</Link>
				<Link to="/playground/guard">Guards</Link>
				<Link to="/playground/nest">Nested</Link>
				<Link to="/playground/live">Live</Link>
				<Link to="/playground/scroll">Scroll</Link>
				<Link to="/playground/search">Search</Link>
			</nav>
		</div>
	);
};
