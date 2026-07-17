import { revalidateCache } from '../utils/revalidateCache';
import { findRoute } from '../utils/findRoute';

export const prefetch = async (pathname: string) => {
	const item = findRoute(pathname);
	if (item) await revalidateCache({ routeItem: item, pathname });
};
