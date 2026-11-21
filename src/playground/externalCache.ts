import { QueryClient } from '@tanstack/react-query';
import { EXTERNAL_QUOTE_STALE_TIME, fetchExternalQuote } from './api';

/**
 * The single helper with the single legitimate cast: `LoaderArgs.context` is
 * `Record<string, unknown>`, so the client arrives typed as `unknown`.
 * Throws a descriptive error instead of failing far away inside query-core.
 */
export const getQueryClient = (context: Record<string, unknown>): QueryClient => {
	if (context.queryClient instanceof QueryClient) return context.queryClient;
	throw new Error(
		'getQueryClient: router context has no queryClient. Pass one via <Router context={{ queryClient }}>.'
	);
};

/**
 * Loader that delegates storage and freshness to TanStack Query: resolves from
 * the query cache while fresh and refetches once stale. The queryKey is fact
 * identity, not route identity, so the same fact is shared across routes.
 * No route staleTime here — the external cache owns freshness.
 * Honest limitation: the loader's AbortSignal is not forwarded to
 * queryClient.query() — a superseded navigation cancels the router flight,
 * but not the query itself. The external cache decides cancellation; this is
 * fine for the demo, a real app would map the signal onto queryFn.
 */
export const externalQuoteLoader = ({
	context,
	params,
}: {
	context: Record<string, unknown>;
	params: Record<string, string>;
}) =>
	getQueryClient(context).query({
		queryKey: ['quote', params.extId],
		queryFn: () => fetchExternalQuote(params.extId),
		staleTime: EXTERNAL_QUOTE_STALE_TIME,
	});
