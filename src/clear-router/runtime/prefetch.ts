import { findRoute } from '../utils/findRoute';
import { RevalidateCache } from '../types/global';

export const createPrefetch = (revalidateCache: RevalidateCache) => async (pathname: string) => {
	const item = findRoute(pathname);
	if (item) await revalidateCache({ routeItem: item, pathname });
};
