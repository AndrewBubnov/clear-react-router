import type { ClientRouteItem, RouteItem } from './types.ts';

const parseClientRouteItem = (el: ClientRouteItem, parentParams: string[] = []): RouteItem[] => {
	const currentParamsList = el.path.match(/:[^/]+/g);
	const currentParams = currentParamsList
		? [...parentParams, ...currentParamsList.map(param => param.slice(1))]
		: parentParams;
	const splitPath = el.path.split('/');
	const path = currentParams.length ? splitPath.slice(0, splitPath.length - 1).join('/') : el.path;
	const currentRoute: RouteItem = { ...el, path, params: currentParams };

	const childRoutes = el.children?.flatMap(child => parseClientRouteItem(child, currentParams)) || [];

	return [currentRoute, ...childRoutes];
};

export const createRouter = (clientList: ClientRouteItem[]) => clientList.flatMap(el => parseClientRouteItem(el, []));

// export const parseRouteParams = (path: string) => {
// 	const matches = path.match(/:[^/]+/g);
// 	const pathSplit = path
// 		.replaceAll(/:[^/]+(\/|$)/g, '')
// 		.split('/')
// 		.filter(Boolean);
// 	return matches
// 		? matches.map((p, index) => {
// 				return { url: pathSplit[index], param: p.slice(1) };
// 			})
// 		: pathSplit;
// };
