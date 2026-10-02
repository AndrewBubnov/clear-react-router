import { Link, useLoaderState } from '../clear-router';

const RetryPage = () => {
	const { data } = useLoaderState<{ value: string; attempt: number }>();
	return (
		<div className="pg-wrap">
			<h1>Retry</h1>
			<p className="pg-hint">
				This loader fails randomly (~50%) with a 400ms delay between attempts.{' '}
				<code>retry: {'{ count: 3, delay: 400 }'}</code> keeps it trying. Reload the page a few times to see
				different attempt counts.
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

export default RetryPage;
