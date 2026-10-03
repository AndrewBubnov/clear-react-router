import { useState } from 'react';
import { Link, useLoaderState } from '../clear-router';

// A fresh fetch commits and mounts within milliseconds, while a cached payload
// was born long before this mount — so birth time tells them apart.
const FROM_CACHE_THRESHOLD = 500;

const RetryPage = () => {
	const { data } = useLoaderState<{ value: string; attempt: number; fetchedAt: number }>();
	const [servedFromCache] = useState(() => Date.now() - data.fetchedAt > FROM_CACHE_THRESHOLD);
	return (
		<div className="pg-wrap">
			<h1>Retry</h1>
			<p className="pg-hint">
				This loader fails randomly (~50%) with a 400ms delay between attempts.{' '}
				<code>retry: {'{ count: 3, delay: 400 }'}</code> keeps it trying. Cached for 30 seconds (
				<code>staleTime: 10000</code>): come back within that window and you get a <code>from cache</code>{' '}
				badge, come back later and the loader runs again with new random attempts.
			</p>
			<div className="pg-card">
				<p>{data.value}</p>
				<p>
					{servedFromCache ? (
						<span className="pg-badge">from cache</span>
					) : (
						<span className="pg-badge ok">attempts: {data.attempt}</span>
					)}
				</p>
			</div>
			<p>
				<Link to="/playground">← Back to playground home</Link>
			</p>
		</div>
	);
};

export default RetryPage;
