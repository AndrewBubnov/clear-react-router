import { useState } from 'react';
import { Link, useInvalidate, useLoaderState } from '../clear-router';
import { getCallCount } from './api';

const PRODUCT_IDS = ['1', '2', '3', '4', '5'];

type InvalidateEntry = { path: string; data: unknown; error: Error | null };

const previewData = (data: unknown, limit = 80) => {
	const text = typeof data === 'string' ? data : (JSON.stringify(data) ?? String(data));
	return text.length > limit ? `${text.slice(0, limit)}…` : text;
};

const errorMessage = (error: Error | null) => (error instanceof Error ? error.message : String(error));

// Errors don't survive JSON.stringify (they'd render as {}), so show their shape explicitly.
const stringifyLoaderState = (data: unknown, loaderError: Error | null, beforeLoadError: Error | null) =>
	JSON.stringify(
		{
			data,
			loaderError: loaderError ? { message: loaderError.message } : null,
			beforeLoadError: beforeLoadError ? { message: beforeLoadError.message } : null,
		},
		null,
		2
	);

const InvalidateLab = () => {
	const invalidate = useInvalidate();
	const [lastResult, setLastResult] = useState<InvalidateEntry[] | null>(null);

	return (
		<div className="pg-card">
			<h2>Invalidation lab</h2>
			<p>
				Each button revalidates and shows per-entry results. The counters below tell whether a fetch actually
				ran. Watch the network tab too.
			</p>
			<p>
				<span className="pg-badge">cache calls: {getCallCount('cache')}</span>{' '}
				<span className="pg-badge">product-1 calls: {getCallCount('product-1')}</span>
			</p>
			<div className="pg-btn-grid">
				<button className="pg-btn" onClick={() => invalidate().then(setLastResult)}>
					Refetch this page
				</button>
				<button className="pg-btn" onClick={() => invalidate('/playground/product/1').then(setLastResult)}>
					Refetch product 1
				</button>
				<button
					className="pg-btn"
					onClick={() => invalidate('/playground/cache', { staleOnly: true }).then(setLastResult)}
				>
					Touch only stale entries
				</button>
				<button className="pg-btn" onClick={() => invalidate('/playground/retry-raw').then(setLastResult)}>
					Refetch the failing route
				</button>
				<button
					className="pg-btn"
					onClick={() => invalidate('/playground/retry-raw', { force: false }).then(setLastResult)}
				>
					Skip uncached entries
				</button>
				<button
					className="pg-btn"
					onClick={() => invalidate('/playground/nest', { withChildren: true }).then(setLastResult)}
				>
					Refetch nest subtree
				</button>
			</div>
			<p className="pg-hint">
				<code>staleOnly</code> leaves fresh entries alone — this page has no <code>staleTime</code>, so it is
				always fresh and the counter above never moves. <code>force: false</code> never fetches uncached paths —
				and the failing route is never cached (failures don&apos;t poison the cache), so it always comes back
				empty. Compare with the plain refetch right above each of them. <code>withChildren</code> revalidates
				the route plus all nested children — open any nest and item first so there is something cached, then
				watch both entries refresh at once.
			</p>
			{lastResult === null ? (
				<p className="pg-hint">press a button</p>
			) : lastResult.length === 0 ? (
				<p className="pg-hint">no matching cache entries — nothing was revalidated</p>
			) : (
				<>
					<ul className="pg-list">
						{lastResult.map(entry => (
							<li key={entry.path}>
								<span className="pg-badge">{entry.path}</span>{' '}
								{entry.error ? (
									<span className="pg-badge err">error: {errorMessage(entry.error)}</span>
								) : entry.data === undefined ? (
									<span className="pg-badge">no loader</span>
								) : (
									<>
										<span className="pg-badge ok">ok</span>{' '}
										<span className="pg-badge">{previewData(entry.data)}</span>
									</>
								)}
							</li>
						))}
					</ul>
					{lastResult.every(entry => entry.data === undefined && !entry.error) && (
						<p className="pg-hint">
							Nothing cached under this route yet — open any nest and an item first (that fills the
							cache), then press again. Note the tiny <code>maxCacheSize: 3</code>: hovering menu links
							prefetches in the background and may evict entries before you press.
						</p>
					)}
				</>
			)}
		</div>
	);
};

const CachePage = () => {
	const { data, loaderError, beforeLoadError } = useLoaderState<string>();
	const loadError = loaderError ?? beforeLoadError;
	return (
		<div className="pg-wrap">
			<h1>Cache: eviction, gcTime, invalidation</h1>
			<p className="pg-hint">
				This playground runs with a tiny <code>maxCacheSize: 3</code>, so eviction is easy to observe. For a
				deterministic run, reload the page first, then follow the steps.
			</p>
			<div className="pg-card">
				<h2>This page itself is cached</h2>
				<p>{data}</p>
				<p className="pg-row pg-no-margin">
					Errors:
					{loadError ? (
						<span className="pg-badge err">{errorMessage(loadError)}</span>
					) : (
						<span className="pg-badge ok">none</span>
					)}
				</p>
				<details className="pg-details">
					<summary>Show raw JSON</summary>
					<pre>{stringifyLoaderState(data, loaderError, beforeLoadError)}</pre>
				</details>
				<p>
					<span className="pg-badge">loader calls: {getCallCount('cache')}</span>
				</p>
				<p className="pg-hint">
					First visit shows a loading fallback (~600ms). Leave and come back — instant render from cache, the
					loader is not called again.
				</p>
			</div>
			<div className="pg-card">
				<h2>LRU eviction</h2>
				<p>
					Open products 1 – 4 in order, then go back to 1. Product 1 was evicted (reloads with a fallback
					flash), product 3 is still cached (instant).
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
};

export default CachePage;
