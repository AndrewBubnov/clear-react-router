import type { ReactElement } from 'react';
import { router } from '../instance';
import { createLazyComponent } from './createLazyComponent';
import { ClientRouteItem, LazyComponent, Location, RouteItem } from '../types';

const isLazy = (el: ClientRouteItem) => typeof el.element === 'function' && el.element.toString().includes('import(');

const parseClientRouteItem = (el: ClientRouteItem, parentPattern = ''): RouteItem[] => {
	const segments = el.path.split('/').filter(Boolean);
	let lastStaticSegment = '';

	for (const segment of segments) {
		if (segment.startsWith(':')) {
			if (!lastStaticSegment) throw new Error(`Route "${el.path}" cannot start with a parameter.`);
		} else {
			lastStaticSegment = segment;
		}
	}

	const pattern = `${parentPattern}/${el.path}`.replace(/\/+/g, '/');
	const resolvedElement = isLazy(el) ? createLazyComponent(el.element as LazyComponent, el.fallback) : el.element;
	const currentRoute: RouteItem = { ...el, pattern, element: resolvedElement as (() => ReactElement) | ReactElement };

	const childRoutes = el.children?.flatMap(child => parseClientRouteItem(child, pattern)) ?? [];

	return [currentRoute, ...childRoutes];
};

export const createRouter = (clientList: ClientRouteItem[]) => clientList.flatMap(el => parseClientRouteItem(el));

export const getParamsObject = (nextItem?: RouteItem, nextPathname?: string) => {
	const {
		routeItem: stateItem,
		location: { pathname: statePathname },
	} = router.state.routeItemDataState.getState();
	const routeItem = nextItem || stateItem;
	const pathname = nextPathname || statePathname;

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

export const comparePaths = (route: RouteItem, pathname: string) => {
	const pattern = route.pattern.split('/').filter(Boolean);
	const current = pathname.split('/').filter(Boolean);
	return pattern.length === current.length
		? pattern.every((segment, index) => segment.startsWith(':') || segment === current[index])
		: false;
};
