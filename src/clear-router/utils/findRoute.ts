import { comparePaths } from './utils';
import { routerConfig } from '../config/routerConfig';

export const ALL_LOCATIONS = '/*';

export const findRoute = (pathname: string, includeAll?: boolean) => {
	if (includeAll) return routerConfig.routes.find(el => el.path === ALL_LOCATIONS || comparePaths(el, pathname));
	return routerConfig.routes.find(el => comparePaths(el, pathname));
};
