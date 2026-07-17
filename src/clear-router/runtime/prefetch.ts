import { revalidateCache } from '../utils/revalidateCache';
import { comparePaths } from '../utils/utils';
import { routerConfig } from '../config/routerConfig';

export const prefetch = async (pathname: string) => {
	const item = routerConfig.routes.find(el => comparePaths(el, pathname));
	if (item) await revalidateCache({ routeItem: item, pathname });
};
