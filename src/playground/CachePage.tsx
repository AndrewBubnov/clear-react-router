import { useEffect, useState } from 'react';
import { Link, useInvalidate, useLoaderState, useRouterContext } from '../clear-router';
import { Button, Modal, RingProgress, Stack, Text } from '@mantine/core';
import { getCallCount, HEAVY_GC_TIME } from './api';
import { usePlaygroundSettings } from './usePlaygroundSettings';
import { isMobileViewport } from './utils.ts';

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
	const { maxCacheSize } = usePlaygroundSettings();
	const [opened, setOpened] = useState(false);
	const [lastResult, setLastResult] = useState<InvalidateEntry[]>([]);

	const run = (result: Promise<InvalidateEntry[]>) =>
		result.then(entries => {
			setLastResult(entries);
			setOpened(true);
		});

	return (
		<div className="pg-card">
			<h2>Invalidation lab</h2>
			<p>
				Each button revalidates and opens a dialog with per-entry results. The counters below tell whether a
				fetch actually ran. Watch the network tab too.
			</p>
			<p>
				<span className="pg-badge">cache calls: {getCallCount('cache')}</span>{' '}
				<span className="pg-badge">product-1 calls: {getCallCount('product-1')}</span>
			</p>
			<div className="pg-btn-grid">
				<Button variant="light" onClick={() => run(invalidate())}>
					Refetch this page
				</Button>
				<Button variant="light" onClick={() => run(invalidate('/playground/product/1'))}>
					Refetch product 1
				</Button>
				<Button variant="light" onClick={() => run(invalidate('/playground/cache', { staleOnly: true }))}>
					Touch only stale entries
				</Button>
				<Button variant="light" onClick={() => run(invalidate('/playground/retry-raw'))}>
					Refetch the failing route
				</Button>
				<Button variant="light" onClick={() => run(invalidate('/playground/retry-raw', { force: false }))}>
					Skip uncached entries
				</Button>
				<Button variant="light" onClick={() => run(invalidate('/playground/nest', { withChildren: true }))}>
					Refetch nest subtree
				</Button>
			</div>
			<p className="pg-hint">
				<code>staleOnly</code> leaves fresh entries alone — this page has no <code>staleTime</code>, so it is
				always fresh and the counter above never moves. <code>force: false</code> never fetches uncached paths —
				and the failing route is never cached (failures don&apos;t poison the cache), so it always comes back
				empty. Compare with the plain refetch right above each of them. <code>withChildren</code> revalidates
				the route plus all nested children — open any nest and item first so there is something cached, then
				watch both entries refresh at once.
			</p>
			<Modal opened={opened} onClose={() => setOpened(false)} title="Invalidation results" centered>
				{lastResult.length === 0 ? (
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
								cache), then press again. Note <code>maxCacheSize: {maxCacheSize}</code>: hovering menu
								links prefetches in the background and may evict entries before you press.
							</p>
						)}
					</>
				)}
			</Modal>
		</div>
	);
};

const GcCountdown = () => {
	const { context } = useRouterContext();
	const gcAt = typeof context.heavyGcAt === 'number' ? context.heavyGcAt : null;
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		if (gcAt === null) return;
		const id = window.setInterval(() => setNow(Date.now()), 100);
		return () => window.clearInterval(id);
	}, [gcAt]);

	if (gcAt === null) return null;
	const remaining = Math.max(0, gcAt - now);
	return (
		<Stack align="center" gap={4} my="sm">
			<RingProgress
				size={96}
				thickness={8}
				roundCaps
				sections={[{ value: (remaining / HEAVY_GC_TIME) * 100, color: remaining > 0 ? 'teal' : 'gray' }]}
				label={
					<Text ta="center" size="sm" c={remaining > 0 ? undefined : 'dimmed'}>
						{remaining > 0 ? `${(remaining / 1000).toFixed(1)}s` : '0s'}
					</Text>
				}
			/>
			<Text size="xs" c="dimmed">
				{remaining > 0 ? 'left until the cache entry is garbage-collected' : 'entry garbage-collected'}
			</Text>
		</Stack>
	);
};

const CachePage = () => {
	const { data, loaderError, beforeLoadError } = useLoaderState<string>();
	const { maxCacheSize, defaultPrefetch } = usePlaygroundSettings();
	const loadError = loaderError ?? beforeLoadError;
	// viewport/render prefetch the loader-backed menu links on mount, so the tiny cache is already full
	// before the eviction steps below can be followed.
	const prefetchFloodsCache =
		defaultPrefetch === 'viewport' ||
		defaultPrefetch === 'render' ||
		(defaultPrefetch === 'auto' && isMobileViewport);
	return (
		<div className="pg-wrap">
			<h1>Cache: eviction, gcTime, invalidation</h1>
			<p className="pg-hint">
				This playground runs with <code>maxCacheSize: {maxCacheSize}</code> (change it on the settings page).
				For a deterministic run, reload the page first, then follow the steps.
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
				{prefetchFloodsCache ? (
					<p className="pg-hint">
						With the <code>{defaultPrefetch}</code> prefetch strategy, the loader-backed menu links prefetch
						on mount and fill the tiny cache before you open anything — the eviction order below is not
						observable. Switch the prefetch strategy to <code>none</code> (or <code>hover</code>) on the
						settings page and come back.
					</p>
				) : (
					<>
						<p>
							{maxCacheSize > 3 ? (
								<>
									Products share the cache with this page&apos;s own loader entry, and LRU only evicts
									once every slot is taken — with <code>maxCacheSize: {maxCacheSize}</code> you would
									need to open {maxCacheSize} distinct products before the oldest one drops out. Pick
									the <code>3 (lab)</code> preset on the settings page to watch eviction in a few
									clicks.
								</>
							) : (
								<>
									Open products #1 → #4 in order, returning to this page in between. Because this
									page&apos;s own entry holds one slot, only the two most recent products stay cached:
									#1 drops out as soon as you open #3, #2 when you open #4. Each visit back here also
									refreshes this page&apos;s recency, so it never gets evicted first. Revisiting an
									evicted product reloads it (fallback flash); the most recent one renders instantly
									from cache.
								</>
							)}
						</p>
						<div className="pg-row pg-items-row">
							{PRODUCT_IDS.map(id => (
								<Link key={id} to={`/playground/product/${id}`} prefetch="none">
									#{id}
								</Link>
							))}
						</div>
					</>
				)}
			</div>
			<div className="pg-card">
				<h2>gcTime</h2>
				<p>
					<Link to="/playground/heavy" prefetch="none">
						Open the heavy page
					</Link>
					, then leave and come back — immediately (cached) and after 10 seconds (garbage-collected, reloads).
				</p>
				<GcCountdown />
			</div>
			<InvalidateLab />
			<p>
				<Link to="/playground">← Back to playground home</Link>
			</p>
		</div>
	);
};

export default CachePage;
