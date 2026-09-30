import { Link, useLoaderState } from '../clear-router';
import { getCallCount } from './api';

export const PrefetchPage = () => {
	const { data } = useLoaderState<string>();
	return (
		<div className="pg-wrap">
			<h1>Prefetch</h1>
			<p className="pg-hint">
				This loader takes ~800ms. Hover the link below, wait a beat, then click — navigation
				is instant and the loader ran exactly once (hover prefetched the data).
			</p>
			<div className="pg-card">
				<p>{data}</p>
				<p>
					<span className="pg-badge">loader calls: {getCallCount('slow')}</span>
				</p>
			</div>
			<p>
				<Link to="/playground">← Back to playground home</Link>
			</p>
		</div>
	);
};
