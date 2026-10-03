import { Link, useInvalidate, useLoaderState } from '../clear-router';

const RetryErrorPage = () => {
	const { loaderError } = useLoaderState();
	const invalidate = useInvalidate();
	return (
		<div className="pg-wrap">
			<h1>Retry</h1>
			<div className="pg-error">{loaderError?.message ?? 'Load failed'}</div>
			<p className="pg-hint">
				All attempts failed, retries included — so the router rendered <code>errorElement</code> instead of the
				page. Trying again runs a brand new fetch chain.
			</p>
			<div className="pg-row">
				<button className="pg-btn" onClick={() => invalidate()}>
					Try again
				</button>
				<Link to="/playground">← Back to playground home</Link>
			</div>
		</div>
	);
};

export default RetryErrorPage;
