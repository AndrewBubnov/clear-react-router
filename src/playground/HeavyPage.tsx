import { useEffect } from 'react';
import { Link, useLoaderState, useRouterContext } from '../clear-router';
import { HEAVY_GC_TIME } from './api';

const HeavyPage = () => {
	const { data } = useLoaderState<string>();
	const { setContext } = useRouterContext();

	// Countdown starts when this route is left — same moment the router's gc timer starts.
	useEffect(
		() => () => setContext(prevState => ({ ...prevState, heavyGcAt: Date.now() + HEAVY_GC_TIME })),
		[setContext]
	);

	return (
		<div className="pg-wrap">
			<h1>Heavy page (gcTime)</h1>
			<div className="pg-card">
				<p>{data}</p>
			</div>
			<p className="pg-hint">
				This route keeps its cache entry for 10 seconds after you leave (<code>gcTime: 10000</code>). Come back
				immediately — instant, no reload. Wait 10 seconds — the entry is garbage-collected and the loader runs
				again (watch the visit counter).
			</p>
			<p>
				<Link to="/playground/cache">← Back to cache lab</Link>
			</p>
		</div>
	);
};

export default HeavyPage;
