import { Link, useLoaderState } from '../clear-router';
import { getCallCount } from './api';

const PrefetchPage = () => {
	const { data } = useLoaderState<string>();
	return (
		<div className="pg-wrap">
			<h1>Prefetch</h1>
			<p className="pg-hint">
				This loader takes ~800ms. On desktop, hover the Prefetch link in the navigation bar above, wait a beat,
				then click it — navigation is instant and the loader ran exactly once (the hover prefetched the data,
				check the counter below). On mobile the default strategy is <code>viewport</code> instead of{' '}
				<code>hover</code>, so menu links prefetch as soon as they mount.
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

export default PrefetchPage;
