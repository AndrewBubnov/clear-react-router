import { Link, useRouteStatus, useLoaderState } from '../clear-router';
import { getCallCount } from './api';

const OptimisticPage = () => {
	const { data } = useLoaderState<{ value: number; generation: number }>();
	const revalidating = useRouteStatus(status => status === 'optimistic');
	return (
		<div className="pg-wrap">
			<h1>Optimistic navigation</h1>
			<p className="pg-hint">
				This route is <code>optimistic</code> with a short <code>staleTime</code>: leave and come straight back
				after a second — the stale value renders instantly, then updates once fresh data arrives after ~1s. The
				badge below is a custom indicator built with <code>useRouteStatus</code> (no built-in spinners — see
				README for the recipe). The generation counter proves the refetch happened. Note: wander across 5+ other
				data pages and the tiny demo cache evicts this entry — then you get a regular loading fallback instead
				(that&apos;s the <Link to="/playground/cache">cache lab</Link>).
			</p>
			<div className="pg-card">
				<p>
					Value: <span className="pg-badge">{data.value}</span>{' '}
					{revalidating && <span className="pg-badge warn">revalidating…</span>}
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

export default OptimisticPage;
