import { useState } from 'react';
import { Link, useInvalidate, useLoaderState, useParams } from '../clear-router';
import { getCallCount } from './api';

const PRODUCT_IDS = ['1', '2', '3', '4', '5'];

export const ProductPage = () => {
	const { productId } = useParams<{ productId: string }>();
	const { data } = useLoaderState<{ id: string; description: string; loads: number }>();
	return (
		<div className="pg-wrap">
			<h1>Product {data.id}</h1>
			<div className="pg-card">
				<p>{data.description}</p>
				<p>
					<span className="pg-badge">
						loader calls for #{productId}: {getCallCount(`product-${productId}`)}
					</span>
				</p>
			</div>
			<p>
				<Link to="/playground/cache">← Back to cache lab</Link>
			</p>
		</div>
	);
};

export const HeavyPage = () => {
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

const InvalidateLab = () => {
	const invalidate = useInvalidate();
	const [lastResult, setLastResult] = useState('press a button');
	const run = async (fn: () => Promise<unknown>) => {
		const result = await fn();
		setLastResult(JSON.stringify(result, null, 2));
	};

	return (
		<div className="pg-card">
			<h2>Invalidation lab</h2>
			<p>Each button revalidates and shows the raw result array. Watch the network tab too.</p>
			<div className="pg-row">
				<button className="pg-btn" onClick={() => run(() => invalidate())}>
					invalidate() current
				</button>
				<button className="pg-btn" onClick={() => run(() => invalidate('/playground/live'))}>
					invalidate live
				</button>
				<button
					className="pg-btn"
					onClick={() => run(() => invalidate('/playground/live', { staleOnly: true }))}
				>
					staleOnly live
				</button>
				<button className="pg-btn" onClick={() => run(() => invalidate('/playground/live', { force: false }))}>
					force: false live
				</button>
			</div>
			<pre className="pg-badge">{lastResult}</pre>
		</div>
	);
};

export const CachePage = () => (
	<div className="pg-wrap">
		<h1>Cache: eviction, gcTime, invalidation</h1>
		<p className="pg-hint">
			This playground runs with a tiny <code>maxCacheSize: 3</code>, so eviction is easy to observe. For a
			deterministic run, reload the page first, then follow the steps.
		</p>
		<div className="pg-card">
			<h2>LRU eviction</h2>
			<p>
				Open products 1 – 4 in order, then go back to 1. Product 1 was evicted (reloads with a fallback flash),
				product 3 is still cached (instant).
			</p>
			<div className="pg-row pg-items-row">
				{PRODUCT_IDS.map(id => (
					<Link key={id} to={`/playground/product/${id}`} prefetch="none">
						#{id}
					</Link>
				))}
			</div>
		</div>
		<div className="pg-card">
			<h2>gcTime</h2>
			<p>
				<Link to="/playground/heavy" prefetch="none">
					Open the heavy page
				</Link>
				, then leave and come back — immediately (cached) and after 7 seconds (garbage-collected, reloads).
			</p>
		</div>
		<InvalidateLab />
		<p>
			<Link to="/playground">← Back to playground home</Link>
		</p>
	</div>
);
