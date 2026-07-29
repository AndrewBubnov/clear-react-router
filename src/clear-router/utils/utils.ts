import type { ReactElement } from 'react';
import { router } from '../instance';
import { createLazyComponent } from './createLazyComponent';
import { ClientRouteItem, LazyComponent, Location, RouteItem } from '../types';

const isLazy = (el: ClientRouteItem) => typeof el.element === 'function' && el.element.toString().includes('import(');

const parseClientRouteItem = (el: ClientRouteItem, parentPath = '', parentPattern = ''): RouteItem[] => {
	const segments = el.path.split('/').filter(Boolean);
	const staticSegments: string[] = [];

	let lastStaticSegment = '';

	for (const segment of segments) {
		if (segment.startsWith(':')) {
			if (!lastStaticSegment) throw new Error(`Route "${el.path}" cannot start with a parameter.`);
		} else {
			lastStaticSegment = segment;
			staticSegments.push(segment);
		}
	}

	const path = `${parentPath}/${staticSegments.join('/')}`.replace(/\/+/g, '/');
	const pattern = `${parentPattern}/${el.path}`.replace(/\/+/g, '/');
	const resolvedElement = isLazy(el) ? createLazyComponent(el.element as LazyComponent, el.fallback) : el.element;
	const currentRoute: RouteItem = {
		...el,
		path,
		pattern,
		element: resolvedElement as (() => ReactElement) | ReactElement,
	};

	const childRoutes = el.children?.flatMap(child => parseClientRouteItem(child, path, pattern)) ?? [];

	return [currentRoute, ...childRoutes];
};

export const createRouter = (clientList: ClientRouteItem[]) => clientList.flatMap(el => parseClientRouteItem(el));

export const getParamsObject = () => {
	const {
		routeItem,
		location: { pathname },
	} = router.state.routeItemDataState.getState();

	if (!routeItem) return {};

	const pathnameSegments = pathname.split('/');
	const rawSegments = routeItem.pattern.split('/');

	return rawSegments.reduce(
		(acc, segment, index) => {
			if (segment.startsWith(':')) {
				acc[segment.slice(1)] = pathnameSegments[index];
			}
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
	const paramsLength = el.pattern.split('/').filter(el => el.startsWith(':')).length;
	if (!paramsLength) return el.path.replaceAll('/', '') === pathname.replaceAll('/', '');
	const splitElementPath = el.path.split('/').filter(Boolean);
	const splitPathname = pathname.split('/').filter(Boolean);
	return (
		splitElementPath.every((item, index) => item === splitPathname[2 * index]) &&
		splitPathname.length === splitElementPath.length + paramsLength
	);
};
