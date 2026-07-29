import type { ReactElement } from 'react';
import { createLazyComponent } from './createLazyComponent';
import { ClientRouteItem, LazyComponent, Location, RouteItem } from '../types';
import { router } from '../instance.ts';

const isLazy = (el: ClientRouteItem) => typeof el.element === 'function' && el.element.toString().includes('import(');

const parseClientRouteItem = (
	el: ClientRouteItem,
	parentParams: string[] = [],
	parentPath = '',
	parentRawPath = ''
): RouteItem[] => {
	const segments = el.path.split('/').filter(Boolean);
	const staticSegments: string[] = [];

	let lastStaticSegment = '';

	for (const segment of segments) {
		if (segment.startsWith(':')) {
			if (!lastStaticSegment) throw new Error(`Route "${el.path}" cannot start with a parameter.`);
			parentParams = [...parentParams, segment];
		} else {
			lastStaticSegment = segment;
			staticSegments.push(segment);
		}
	}

	const path = `${parentPath}/${staticSegments.join('/')}`.replace(/\/+/g, '/');
	const rawPath = `${parentRawPath}${el.path}`;
	const resolvedElement = isLazy(el) ? createLazyComponent(el.element as LazyComponent, el.fallback) : el.element;
	const currentRoute: RouteItem = {
		...el,
		path,
		rawPath,
		params: parentParams,
		element: resolvedElement as (() => ReactElement) | ReactElement,
	};

	const childRoutes = el.children?.flatMap(child => parseClientRouteItem(child, parentParams, path, rawPath)) ?? [];

	return [currentRoute, ...childRoutes];
};

export const createRouter = (clientList: ClientRouteItem[]) => clientList.flatMap(el => parseClientRouteItem(el, []));

export const getParamsObject = () => {
	const {
		routeItem,
		location: { pathname },
	} = router.state.routeItemDataState.getState();
	if (!routeItem) return {};
	const splitPathname = pathname.split('/');
	const splitRawPath = routeItem.rawPath.split('/');
	return routeItem.params.reduce(
		(acc, cur) => {
			acc[cur.slice(1)] = splitPathname[splitRawPath.indexOf(cur)];
			return acc;
		},
		{} as Record<string, string>
	);
};

export const parseWindowLocation = (location: typeof window.location): Location => ({
	pathname: location.pathname,
	search: location.search,
});

export const comparePaths = (el: RouteItem, pathname: string) => {
	const paramsLength = Object.keys(el.params).length;
	if (!paramsLength) return el.path.replaceAll('/', '') === pathname.replaceAll('/', '');
	const splitElementPath = el.path.split('/').filter(Boolean);
	const splitPathname = pathname.split('/').filter(Boolean);
	return (
		splitElementPath.every((item, index) => item === splitPathname[2 * index]) &&
		splitPathname.length === splitElementPath.length + paramsLength
	);
};
