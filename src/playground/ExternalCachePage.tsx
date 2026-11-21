import { Button, Stack, Text } from '@mantine/core';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useInvalidate, useLoaderState, useParams } from '../clear-router';

import { EXTERNAL_QUOTE_STALE_TIME, fetchExternalQuote, type ExternalQuote } from './api';

/** Same as the loader: TQ decides whether a refetch is needed. */
const quoteQuery = (symbol: string, staleTime = EXTERNAL_QUOTE_STALE_TIME) => ({
	queryKey: ['quote', symbol] as const,
	queryFn: () => fetchExternalQuote(symbol),
	staleTime,
});

const SYMBOLS = ['CLR', 'VITE', 'REACT'];

const ExternalCachePage = () => {
	const { extId } = useParams<{ extId?: string }>();
	const { data, loaderError, beforeLoadError } = useLoaderState<ExternalQuote>();
	const invalidate = useInvalidate();
	const queryClient = useQueryClient();

	// A second view on the SAME fact key: useQuery reads the same external
	// cache entry the loader wrote, so no extra fetch happens here.
	const ticker = useQuery({ ...quoteQuery(extId ?? ''), enabled: !!extId });

	const count = (n: number) => `ext-${extId} calls: ${n}`;
	const loadError = loaderError ?? beforeLoadError;

	if (!extId) {
		return (
			<div className="pg-wrap">
				<h1>External data cache (TanStack Query)</h1>
				<div className="pg-card">
					<h2>Pick a fact</h2>
					<p className="pg-hint">
						Same route, different data: each symbol is its own fact under the shared{' '}
						<code>['quote', symbol]</code> query key — not a separate route cache entry.
					</p>
					<div className="pg-row pg-items-row">
						{SYMBOLS.map(symbol => (
							<Link
								key={symbol}
								path="/playground/cache/external/:extId"
								params={{ extId: symbol }}
								data-testid={`ext-symbol-${symbol}`}
							>
								{symbol}
							</Link>
						))}
					</div>
				</div>
				<p>
					<Link to="/playground/cache">← Back to cache lab</Link>
				</p>
			</div>
		);
	}

	return (
		<div className="pg-wrap">
			<h1>External data cache (TanStack Query)</h1>
			<div className="pg-card">
				<h2>Route snapshot (loader pipeline)</h2>
				<p className="pg-row pg-no-margin">
					{loadError ? (
						<span className="pg-badge err">{loadError.message}</span>
					) : (
						<>
							<span className="pg-badge">{data?.symbol}</span>
							<span className="pg-badge ok">${data?.price}</span>
							<span className="pg-badge">fetched at {data?.fetchedAt}</span>
							<span className="pg-badge" data-testid="ext-snapshot-loads">
								{count(data?.loads ?? 0)}
							</span>
						</>
					)}
				</p>
				<p className="pg-hint">
					The loader runs on every navigation (the route is flagged <code>externalCache</code> — the router
					cache stores values but never claims freshness over the fact), but it delegates to{' '}
					<code>queryClient.query()</code> with a 5s staleTime: while the fact is fresh it resolves from
					TanStack&apos;s cache without a network call; once it is stale the loader awaits a refetch. Storage,
					eviction and staleness all live in the external cache — the router only decides <em>when</em> to run
					loaders.
				</p>
			</div>
			<div className="pg-card">
				<h2>Fact subscription (live TanStack cache)</h2>
				<Stack gap={4}>
					<Text size="sm">
						<code>useQuery</code> panel — same query key <code>['quote', {extId}]</code>:
					</Text>
					<Text size="sm">
						{ticker.data ? (
							<>
								<span className="pg-badge ok">${ticker.data.price}</span>{' '}
								<span className="pg-badge">fetched at {ticker.data.fetchedAt}</span>{' '}
								<span className="pg-badge" data-testid="ext-live-loads">
									{count(ticker.data.loads)}
								</span>
							</>
						) : (
							<span className="pg-badge">loading…</span>
						)}
					</Text>
				</Stack>
				<p className="pg-hint">
					The loader and this panel share one cache entry — a fact keyed by data identity, not by route. The
					same symbol on any other route would hit the same entry.
				</p>
			</div>
			<div className="pg-card">
				<h2>Who owns freshness</h2>
				<p className="pg-hint">
					Press within 5 seconds of a fetch and watch the call counter above the buttons:
				</p>
				<p className="pg-row pg-no-margin">
					<span className="pg-badge" data-testid="ext-loads">
						{count(ticker.data?.loads ?? 0)}
					</span>
				</p>
				<div className="pg-btn-grid">
					<Button
						size="xs"
						data-testid="ext-router-invalidate"
						onClick={() => {
							void invalidate();
						}}
					>
						Router invalidate (force loader)
					</Button>
					<Button
						size="xs"
						data-testid="ext-tq-invalidate"
						onClick={() => {
							void queryClient.invalidateQueries({ queryKey: ['quote', extId] }).then(() => invalidate());
						}}
					>
						TQ invalidate, then router invalidate
					</Button>
				</div>
				<p className="pg-hint">
					<em>Router invalidate</em> re-runs the loader, and the loader asks TanStack with its 5s staleTime:
					inside the window the counter does not move — the router can no longer force a refetch it no longer
					owns. Wait for the window to expire and the same button refetches. <em>TQ invalidate</em> marks the
					fact stale right away: active subscriptions (the panel above) refetch at once, and where nobody is
					subscribed the refetch happens on the next loader run. The chained router invalidate only refreshes
					the route snapshot while you stay here — usually you don&apos;t need it. Invalidation of facts
					belongs to the external cache; the router just re-runs loaders.
				</p>
			</div>
			<div className="pg-card">
				<h2>Same route, different data</h2>
				<p className="pg-hint">
					CLR, VITE and REACT are mock ticker symbols (make-believe stocks — the{' '}
					<Link to="/playground/live">Live page</Link> quotes the same ones). All three buttons open the same
					route — only the <code>:extId</code> param differs. The router sees three different navigations; the
					external cache sees three different facts (one per symbol). The counter below is this symbol&apos;s
					fetch count — it travels with you across symbols. This section is flagged <code>externalCache</code>
					: the router cache never claims freshness over the facts — hover prefetch still warms the external
					cache, but the loader re-runs on every navigation and the external cache decides whether a fetch
					happens. Try it: open CLR, then VITE — each first visit fetches. Now open CLR again within{' '}
					<code>5 seconds</code> — the loader still runs, but the counter does not move: the cached value
					renders instantly.
				</p>
				<p className="pg-row pg-no-margin">
					<span className="pg-badge">{count(ticker.data?.loads ?? 0)}</span>
				</p>
				<div className="pg-row pg-items-row">
					{SYMBOLS.map(symbol => (
						<Link
							key={symbol}
							path="/playground/cache/external/:extId"
							params={{ extId: symbol }}
							data-testid={`ext-symbol-${symbol}`}
						>
							{symbol}
						</Link>
					))}
				</div>
			</div>
			<p>
				<Link to="/playground/cache">← Back to cache lab</Link>
			</p>
		</div>
	);
};

export default ExternalCachePage;
