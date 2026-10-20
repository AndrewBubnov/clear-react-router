import { comparePaths } from './utils';
import { routerConfig } from '../config/routerConfig';

export const NOT_FOUND = '*';

export const findRoute = (pathname: string, includeAll?: boolean) => {
	if (includeAll) return routerConfig.routes.find(el => el.path === NOT_FOUND || comparePaths(el, pathname));
	return routerConfig.routes.find(el => comparePaths(el, pathname));
};
