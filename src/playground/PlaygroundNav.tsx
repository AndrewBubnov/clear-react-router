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
				<Switch checked={isAnimated} onCheckedChange={setIsAnimated}>
					<span>animated</span>
				</Switch>
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
				<Link to="/playground/settings">Settings</Link>
			</nav>
		</div>
	);
};
