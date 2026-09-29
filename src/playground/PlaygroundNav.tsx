import { Link } from '../clear-router';

export const PlaygroundNav = () => (
	<nav className="pg-nav" aria-label="Playground">
		<span className="pg-brand">Clear Router playground</span>
		<Link to="/playground">Home</Link>
		<Link to="/playground/scroll">Scroll</Link>
		<Link to="/playground/retry">Retry</Link>
		<Link to="/playground/retry-raw">No-retry</Link>
		<Link to="/playground/live">Live</Link>
		<Link to="/playground/actions">Actions</Link>
		<Link to="/playground/blocker">Blocker</Link>
	</nav>
);
