import { useState } from 'react';
import { Link, useInvalidate, useLoaderState } from '../clear-router';

const RetryErrorPage = () => {
	const { loaderError } = useLoaderState();
	const invalidate = useInvalidate();
	const [isRetrying, setIsRetrying] = useState(false);

	const retry = async () => {
		setIsRetrying(true);
		try {
			await invalidate();
		} finally {
			setIsRetrying(false);
		}
	};
	return (
		<div className="pg-wrap">
			<h1>Retry</h1>
			<div className="pg-error">{loaderError?.message ?? 'Load failed'}</div>
			<p className="pg-hint">
				All attempts failed, retries included — so the router rendered <code>errorElement</code> instead of the
				page. Trying again runs a brand new fetch chain.
			</p>
			<div className="pg-row">
				<button className="pg-btn" disabled={isRetrying} onClick={retry}>
					{isRetrying ? 'Retrying…' : 'Try again'}
				</button>
				<Link to="/playground">← Back to playground home</Link>
			</div>
		</div>
	);
};

export default RetryErrorPage;
