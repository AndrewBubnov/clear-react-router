import { useEffect, useState } from 'react';
import { Link, useLoaderState, useRouterContext } from '../clear-router';

type Badge = { id: number; cached: boolean } | null;

const RetryPage = () => {
	const { data } = useLoaderState<{ value: string; attempt: number; fetchedAt: number }>();
	const { context, setContext } = useRouterContext();
	const [badge, setBadge] = useState<Badge>(null);

	if (badge?.id !== data.fetchedAt) {
		setBadge({ id: data.fetchedAt, cached: context.retryFetchedAt === data.fetchedAt });
	}

	useEffect(() => {
		if (context.retryFetchedAt !== data.fetchedAt) {
			setContext(prevState => ({ ...prevState, retryFetchedAt: data.fetchedAt }));
		}
	}, [context.retryFetchedAt, data.fetchedAt, setContext]);

	return (
		<div className="pg-wrap">
			<h1>Retry</h1>
			<p className="pg-hint">
				This loader fails randomly (~50%) with a 400ms delay between attempts.{' '}
				<code>retry: {'{ count: 3, delay: 400 }'}</code> keeps it trying. Cached for 10 seconds (
				<code>staleTime: 10000</code>): come back within that window and you get a <code>from cache</code>{' '}
				badge, come back later and the loader runs again with new random attempts.
			</p>
			<div className="pg-card">
				<p>{data.value}</p>
				<p>
					{badge?.cached ? (
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
