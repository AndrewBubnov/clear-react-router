import { useCallback, useEffect, useState } from 'react';
import type { RouteItem } from '../types.ts';

export const useLoader = (routeItem: RouteItem | undefined) => {
	const [loaderCache, setLoaderCache] = useState<Record<string, unknown>>({});
	const [cacheTimestamps, setCacheTimestamps] = useState<Record<string, number>>({});
	const [loaderError, setLoaderError] = useState<boolean>(false);

	const updateCache = useCallback(
		({ key, value }: { key: string; value: unknown }) =>
			setLoaderCache(prevState => ({
				...prevState,
				[key]: value,
			})),
		[]
	);

	useEffect(() => {
		(async () => {
			if (!routeItem?.loader) return;
			const currentCacheTimestamp = cacheTimestamps[window.location.pathname];
			if (currentCacheTimestamp && Date.now() - currentCacheTimestamp < (routeItem.staleTime || 0)) return;
			setLoaderCache(prevState =>
				Object.keys(prevState)
					.filter(el => el !== window.location.pathname)
					.reduce((acc, cur) => ({ ...acc, [cur]: prevState[cur] }), {})
			);
			try {
				setLoaderError(false);
				const result = await routeItem?.loader();
				setCacheTimestamps(prevState => ({
					...prevState,
					[window.location.pathname]: Date.now(),
				}));
				updateCache({ key: window.location.pathname, value: result });
			} catch {
				setLoaderError(true);
			}
		})();
	}, [cacheTimestamps, routeItem, updateCache]);

	return { loaderCache, loaderError };
};
