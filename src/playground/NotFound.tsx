import { Link, useLocation } from '../clear-router';

const PlaygroundNotFound = () => {
	const { pathname } = useLocation();
	return (
		<div className="pg-wrap">
			<h1>Page not found</h1>
			<p className="pg-hint">
				No route matches <code>{pathname}</code> — the router rendered the <code>path: &apos;*&apos;</code>{' '}
				catch-all route.
			</p>
			<p>
				<Link to="/playground">← Back to playground home</Link>
			</p>
		</div>
	);
};

export default PlaygroundNotFound;
