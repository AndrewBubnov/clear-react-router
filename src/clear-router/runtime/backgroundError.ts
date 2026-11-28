import { routerConfig } from '../config/routerConfig';
import { type RouteItem, type RouterState } from '../types';

type LoaderMap = RouterState['loaderMap'];

// A failed background revalidation must not wipe a page that already shows data:
// keep the displayed value, report the failure through onBackgroundError and a dev
// warning, and demote the cache entry so the next visit refetches. Returns the data
// to keep, or undefined when nothing is displayed (the caller keeps the hard
// errorElement path).
export const handleBackgroundFailure = (
	loaderMap: LoaderMap,
	path: string,
	error: Error,
	routeItem: RouteItem | undefined,
	displayedData: unknown,
	syncCacheSnapshot: () => void
): unknown => {
	const cachedState = loaderMap.get(path)?.state;
	const entry = loaderMap.get(path);
	const keptData = displayedData ?? cachedState?.data;
	if (entry) {
		entry.staleTime = 0;
		syncCacheSnapshot();
	}
	if (import.meta.env.DEV) {
		console.warn(
			`[clear-react-router] background revalidation failed for ${path}${keptData != null ? '; keeping displayed data' : ''}.`
		);
	}
	routerConfig.onBackgroundError?.(error, { path, route: routeItem as RouteItem });
	return keptData ?? undefined;
};
