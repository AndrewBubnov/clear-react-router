import { Link, useLoaderState } from '../clear-router';
import { getCallCount } from './api';

export const OptimisticPage = () => {
	const { data } = useLoaderState<{ value: number; generation: number }>();
	return (
		<div className="pg-wrap">
			<h1>Optimistic navigation</h1>
			<p className="pg-hint">
				This route is <code>optimistic</code> with a short <code>staleTime</code>: leave and
				come back after a second — the stale value renders instantly (watch the spinner in
				the corner), then updates once fresh data arrives. The generation counter proves the
				refetch happened.
			</p>
			<div className="pg-card">
				<p>
					Value: <span className="pg-badge">{data.value}</span>
				</p>
				<p>
					<span className="pg-badge">generation: {data.generation}</span>{' '}
					<span className="pg-badge">loader calls: {getCallCount('optimistic')}</span>
				</p>
			</div>
			<p>
				<Link to="/playground">← Back to playground home</Link>
			</p>
		</div>
	);
};
