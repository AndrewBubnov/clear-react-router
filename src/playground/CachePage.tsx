import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link, useInvalidate, useLoaderState, useRouterContext } from '../clear-router';
import { Button, RingProgress, Stack, Text } from '@mantine/core';
import { CACHE_STALE_TIME, getCallCount, HEAVY_GC_TIME } from './api';
import { usePlaygroundSettings } from './usePlaygroundSettings';

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
	const [lastResult, setLastResult] = useState<InvalidateEntry[] | null>(null);
	const [resultVersion, setResultVersion] = useState(0);
	const [pending, setPending] = useState<string | null>(null);

	const run = (key: string, result: Promise<InvalidateEntry[]>) => {
		setPending(key);
		result
			.then(entries => {
				setLastResult(entries);
				setResultVersion(version => version + 1);
			})
			.finally(() => setPending(null));
	};
	const buttonState = (key: string) => ({
		loading: pending === key,
		disabled: pending !== null && pending !== key,
	});

	return (
		<div className="pg-card">
			<h2>Invalidation lab</h2>
			<p>
				Each button revalidates and shows per-entry results in the card above the buttons. The counters below
				tell whether a fetch actually ran. Watch the network tab too.
			</p>
			<p>
				<span className="pg-badge">cache calls: {getCallCount('cache')}</span>{' '}
				<span className="pg-badge">product-1 calls: {getCallCount('product-1')}</span>
			</p>
			<ul className="pg-hint pg-hint-list">
				<li>
					<code>staleOnly</code> only refetches stale entries. This page stays fresh for{' '}
					{CACHE_STALE_TIME / 1000} seconds, so pressing sooner returns no entries; after that the counter
					moves.
				</li>
				<li>
					<code>force: false</code> skips uncached paths. The failing route is never cached (failures
					don&apos;t poison the cache), so this always comes back empty. Compare it with the plain refetch
					button.
				</li>
				<li>
					<code>withChildren</code> revalidates the route and all nested children. Open a nest and an item
					first so there is something cached, then watch both entries refresh at once.
				</li>
			</ul>
			{lastResult && (
				<motion.div
					style={{ overflow: 'hidden' }}
					initial={{ height: 0, marginTop: 0 }}
					animate={{ height: 'auto', marginTop: 12 }}
					transition={{ type: 'spring', stiffness: 400, damping: 34, mass: 0.8 }}
				>
					<div className="pg-invalidate-result" role="status">
						<div className="pg-invalidate-result__head">
							<span className="pg-invalidate-result__title">Invalidation results</span>
							<span className="pg-badge">
								{lastResult.length === 0
									? 'no entries'
									: `${lastResult.length} ${lastResult.length === 1 ? 'entry' : 'entries'}`}
							</span>
						</div>
						<motion.div
							key={resultVersion}
							initial={{ opacity: 0, x: -10 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.18, ease: 'easeOut' }}
						>
							{lastResult.length === 0 ? (
								<p className="pg-invalidate-result__empty">
									no matching cache entries — nothing was revalidated
								</p>
							) : (
								<>
									<div className="pg-invalidate-result__row">
										{lastResult.map(entry => (
											<div className="pg-invalidate-result__entry" key={entry.path}>
												<span className="pg-badge" title={entry.path}>
													{entry.path}
												</span>
												{entry.error ? (
													<span className="pg-badge err" title={errorMessage(entry.error)}>
														error: {errorMessage(entry.error)}
													</span>
												) : entry.data === undefined ? (
													<span className="pg-badge">no loader</span>
												) : (
													<>
														<span className="pg-badge ok">ok</span>
														<span
															className="pg-invalidate-result__data"
															title={previewData(entry.data, 1000)}
														>
															{previewData(entry.data)}
														</span>
													</>
												)}
											</div>
										))}
									</div>
									{lastResult.every(entry => entry.data === undefined && !entry.error) && (
										<p className="pg-hint">
											Nothing cached under this route yet — open any nest and an item first (that
											fills the cache), then press again. Note{' '}
											<code>maxCacheSize: {maxCacheSize}</code>: hovering menu links prefetches in
											the background and may evict entries before you press.
										</p>
									)}
								</>
							)}
						</motion.div>
					</div>
				</motion.div>
			)}
			<div className="pg-btn-grid">
				<Button variant="light" onClick={() => run('page', invalidate())} size="xs" {...buttonState('page')}>
					Refetch this page
				</Button>
				<Button
					variant="light"
					onClick={() => run('product/1', invalidate('/playground/cache/product/1'))}
					size="xs"
					{...buttonState('product/1')}
				>
					Refetch product 1
				</Button>
				<Button
					variant="light"
					onClick={() => run('stale', invalidate('/playground/cache', { staleOnly: true }))}
					size="xs"
					{...buttonState('stale')}
				>
					Touch only stale entries
				</Button>
				<Button
					variant="light"
					onClick={() => run('failing', invalidate('/playground/retry-raw'))}
					size="xs"
					{...buttonState('failing')}
				>
					Refetch the failing route
				</Button>
				<Button
					variant="light"
					onClick={() => run('skip', invalidate('/playground/retry-raw', { force: false }))}
					size="xs"
					{...buttonState('skip')}
				>
					Skip uncached entries
				</Button>
				<Button
					variant="light"
					onClick={() => run('nest', invalidate('/playground/nest', { withChildren: true }))}
					size="xs"
					{...buttonState('nest')}
				>
					Refetch nest subtree
				</Button>
			</div>
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
	const { maxCacheSize, showCacheVisualizer } = usePlaygroundSettings();
	const loadError = loaderError ?? beforeLoadError;
	return (
		<div className="pg-wrap">
			<h1>Cache: eviction, gcTime, invalidation</h1>
			<div className="pg-card">
				<h2>This page itself is cached for {CACHE_STALE_TIME / 1000} seconds</h2>
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
					<span className="pg-badge">loader calls: {getCallCount('cache')}</span>{' '}
					<span className="pg-badge">staleTime: {CACHE_STALE_TIME}ms</span>
				</p>
				<p className="pg-hint">
					First visit shows a loading fallback (~600ms). Leave and come back within {CACHE_STALE_TIME / 1000}{' '}
					seconds — the loader is skipped and the cached payload renders instantly. After that the entry is
					stale, so the next visit runs the loader again. Set <code>staleTime: Infinity</code> when data
					should stay fresh until it is invalidated or evicted.
				</p>
			</div>
			<div className="pg-card">
				<h2>LRU eviction</h2>
				<p className="pg-hint">
					This playground runs with <code>maxCacheSize: {maxCacheSize}</code> (change it on the{' '}
					<Link to="/playground/settings">settings page</Link>). The active route is pinned, so the oldest
					other entry is the one that gets evicted.
				</p>
				<p>
					{maxCacheSize > 3 ? (
						<>
							Products share the cache with this page&apos;s own loader entry, and LRU only evicts once
							every slot is taken — you would need to open {maxCacheSize} distinct products before the
							oldest one drops out. Set the cache size slider to <code>3</code> to watch eviction in a few
							clicks.
						</>
					) : showCacheVisualizer ? (
						<>
							Open products #1–#5 — or hover them when prefetch is enabled — and watch the visualizer
							evict the oldest entry.
						</>
					) : (
						<>Open products #1–#5 in any order.</>
					)}
				</p>
				<div className="pg-row pg-items-row">
					{PRODUCT_IDS.map(id => (
						<Link key={id} to={`/playground/cache/product/${id}`} aria-label={`Open product ${id}`}>
							#{id}
						</Link>
					))}
				</div>
			</div>
			<div className="pg-card">
				<h2>gcTime</h2>
				<p>
					<Link to="/playground/cache/heavy" prefetch="none">
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
