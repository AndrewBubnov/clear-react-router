import { Link, useLocation, useRouterContext } from '../clear-router';

const GuardPage = () => {
	const { context, setContext } = useRouterContext();
	const { state } = useLocation();
	const from = (state as { from?: string } | undefined)?.from;
	const isAuthorized = context.isAuthorized;

	return (
		<div className="pg-wrap">
			<h1>Route guards</h1>
			<p className="pg-hint">
				<code>beforeLoad</code> runs before every navigation and can redirect elsewhere — for auth checks,
				validation, feature flags. Below, authorization is faked with a context toggle; the dashboard route
				guards itself and redirects here when unauthorized.
			</p>
			{from && !isAuthorized && (
				<div className="pg-error">
					<code>{from}</code> requires login — you were redirected here by the route guard, with the origin
					passed via navigation <code>state</code>.
				</div>
			)}
			<div className="pg-card">
				<p>
					Status:{' '}
					<span className={`pg-badge ${isAuthorized ? 'ok' : 'warn'}`}>
						{isAuthorized ? 'authorized' : 'guest'}
					</span>
				</p>
				<div className="pg-row">
					<button className="pg-btn" onClick={() => setContext({ ...context, isAuthorized: !isAuthorized })}>
						{isAuthorized ? 'Log out' : 'Log in'}
					</button>
					<Link to="/playground/dashboard">Try opening dashboard →</Link>
				</div>
			</div>
			<p>
				<Link to="/playground">← Back to playground home</Link>
			</p>
		</div>
	);
};

export default GuardPage;
