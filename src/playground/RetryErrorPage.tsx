import { useState } from 'react';
import { Alert, Button } from '@mantine/core';
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
			<Alert color="red">{loaderError?.message ?? 'Load failed'}</Alert>
			<p className="pg-hint">
				All attempts failed, retries included — so the router rendered <code>errorElement</code> instead of the
				page. Trying again runs a brand new fetch chain.
			</p>
			<div className="pg-row">
				<Button variant="light" disabled={isRetrying} onClick={retry} size="xs">
					{isRetrying ? 'Retrying…' : 'Try again'}
				</Button>
				<Link to="/playground">← Back to playground home</Link>
			</div>
		</div>
	);
};

export default RetryErrorPage;
