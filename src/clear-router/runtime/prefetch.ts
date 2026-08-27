import { findRoute } from '../utils/findRoute';
import { RevalidateCache } from '../types';

export const createPrefetch = (revalidateCache: RevalidateCache) => async (location: Location) => {
	const item = findRoute(location.pathname);
	if (item) {
		await item.preloadElement?.();
		await revalidateCache({ routeItem: item, location });
	}
};
