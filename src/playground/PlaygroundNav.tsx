import { Link } from '../clear-router';

export const PlaygroundNav = () => (
	<nav className="pg-nav" aria-label="Playground">
		<span className="pg-brand">Clear Router playground</span>
		<Link to="/playground" exact>
			Home
		</Link>
		<Link to="/playground/scroll">Scroll</Link>
		<Link to="/playground/retry">Retry</Link>
		<Link to="/playground/retry-raw">No-retry</Link>
		<Link to="/playground/live">Live</Link>
		<Link to="/playground/actions">Actions</Link>
		<Link to="/playground/blocker">Blocker</Link>
		<Link to="/playground/prefetch">Prefetch</Link>
		<Link to="/playground/optimistic">Optimistic</Link>
		<Link to="/playground/cache">Cache</Link>
		<Link to="/playground/search">Search</Link>
		<Link to="/playground/login">Login</Link>
	</nav>
);
