import { Link, useLoaderState } from '../clear-router';

const HeavyPage = () => {
	const { data } = useLoaderState<string>();
	return (
		<div className="pg-wrap">
			<h1>Heavy page (gcTime)</h1>
			<div className="pg-card">
				<p>{data}</p>
			</div>
			<p className="pg-hint">
				This route keeps its cache entry for 5 seconds after you leave (<code>gcTime: 5000</code>). Come back
				immediately — instant, no reload. Wait 7 seconds — the entry is garbage-collected and the loader runs
				again (watch the visit counter).
			</p>
			<p>
				<Link to="/playground/cache">← Back to cache lab</Link>
			</p>
		</div>
	);
};

export default HeavyPage;
