import { Link, useLoaderState } from '../clear-router';

export const RetryPage = () => {
	const { data } = useLoaderState<{ value: string; attempt: number }>();
	return (
		<div className="pg-wrap">
			<h1>Retry</h1>
			<p className="pg-hint">
				This loader fails randomly (~50%) with a 400ms delay between attempts.{' '}
				<code>retry: {'{ count: 3, delay: 400 }'}</code> keeps it trying. Reload the page a
				few times to see different attempt counts.
			</p>
			<div className="pg-card">
				<p>{data.value}</p>
				<p>
					<span className="pg-badge ok">attempts: {data.attempt}</span>
				</p>
			</div>
			<p>
				<Link to="/playground">← Back to playground home</Link>
			</p>
		</div>
	);
};

export const RetryErrorView = () => {
	const { loaderError } = useLoaderState();
	return (
		<div className="pg-wrap">
			<h1>Retry</h1>
			<div className="pg-error">{loaderError?.message ?? 'Load failed'}</div>
			<p className="pg-hint">
				This twin route has <code>retry: 0</code>, so the failure above is final — the
				router rendered <code>errorElement</code> instead of retrying.
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
