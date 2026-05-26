import type { ClientRouteItem, RouteItem } from './types.ts';

const parseClientRouteItem = (el: ClientRouteItem, parentParams: RouteItem['params'] = []): RouteItem[] => {
	const currentParamsList = el.path.match(/:[^/]+/g);

	const normalizedSplitPath = el.path
		.replaceAll(/:[^/]+(\/|$)/g, '')
		.split('/')
		.filter(Boolean);

	const splitPath = el.path.split('/');

	const currentParams = currentParamsList
		? [
				...parentParams,
				...currentParamsList.map((param, index) => ({
					key: normalizedSplitPath[index],
					value: param.slice(1),
				})),
			]
		: parentParams;

	const path = currentParams.length ? splitPath.slice(0, splitPath.length - 1).join('/') : el.path;

	const currentRoute: RouteItem = { ...el, path, params: currentParams };

	const childRoutes = el.children?.flatMap(child => parseClientRouteItem(child, currentParams)) || [];

	return [currentRoute, ...childRoutes];
};

export const createRouter = (clientList: ClientRouteItem[]) => clientList.flatMap(el => parseClientRouteItem(el, []));

export const getParamsObject = (params: RouteItem['params'], split: string[]) =>
	(params || [])
		.map(el => ({ index: split.findIndex(item => item === el.key), value: el.value }))
		.reduce((acc, cur) => ({ ...acc, [cur.value]: split[cur.index + 1] }), {});
