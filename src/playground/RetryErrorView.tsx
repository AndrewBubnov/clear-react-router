import { Link, useLoaderState } from '../clear-router';

const RetryErrorView = () => {
	const { loaderError } = useLoaderState();
	return (
		<div className="pg-wrap">
			<h1>Retry</h1>
			<div className="pg-error">{loaderError?.message ?? 'Load failed'}</div>
			<p className="pg-hint">
				This twin route has <code>retry: 0</code>, so the failure above is final — the router rendered{' '}
				<code>errorElement</code> instead of retrying.
			</p>
			<div className="pg-row">
				<button className="pg-btn" onClick={() => window.location.reload()}>
					Reload the page
				</button>
				<Link to="/playground/retry">Go to the retrying version →</Link>
			</div>
			<p>
				<Link to="/playground">← Back to playground home</Link>
			</p>
		</div>
	);
};

export default RetryErrorView;
