import { findRoute } from '../utils/findRoute';
import { RevalidateCache, RouterState } from '../types';

export const createPrefetch =
	({ routeItemDataState }: RouterState, revalidateCache: RevalidateCache) =>
	async (location: Location) => {
		const item = findRoute(location.pathname);
		if (item) {
			const currentLocation = routeItemDataState.getState().location;
			if (location.pathname === currentLocation.pathname && location.search === currentLocation.search) return;
			await item.preloadElement?.();
			await revalidateCache({ routeItem: item, location });
		}
	};
