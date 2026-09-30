import { Link, useLocation, useNavigate, useRouterContext } from '../clear-router';

export const LoginPage = () => {
	const { context, setContext } = useRouterContext();
	const { state } = useLocation();
	const from = (state as { from?: string } | undefined)?.from;
	const navigate = useNavigate();
	const isAuthorized = (context as { isAuthorized?: boolean }).isAuthorized === true;

	const toggle = async () => {
		setContext({ ...context, isAuthorized: !isAuthorized });
		if (!isAuthorized) await navigate('/playground/dashboard');
	};

	return (
		<div className="pg-wrap">
			<h1>Login</h1>
			<p className="pg-hint">
				Auth state lives in the router context. The dashboard route guards itself in <code>beforeLoad</code> and
				redirects here when unauthorized.
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
					<button className="pg-btn" onClick={toggle}>
						{isAuthorized ? 'Log out' : 'Log in (and go to dashboard)'}
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

export const DashboardPage = () => (
	<div className="pg-wrap">
		<h1>Dashboard</h1>
		<div className="pg-card">
			<p>
				<span className="pg-badge ok">authorized area</span>
			</p>
			<p>You only see this because `beforeLoad` let you through.</p>
		</div>
		<p>
			<Link to="/playground">← Back to playground home</Link>
		</p>
	</div>
);
