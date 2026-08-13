import { router } from '../instance';
import { createLazyComponent } from './createLazyComponent';
import { ClientRouteItem, LazyComponent, Location, RenderElement, RouteItem } from '../types';

const isLazy = (el: ClientRouteItem) => typeof el.element === 'function' && el.element.toString().includes('import(');

const parseClientRouteItem = (el: ClientRouteItem, parentPattern = ''): RouteItem[] => {
	const pattern = `${parentPattern}/${el.path}`.replace(/\/+/g, '/');
	const preloadElement = isLazy(el)
		? createLazyComponent(el.element as LazyComponent, el.fallback).preloadElement
		: undefined;
	const resolvedElement = isLazy(el)
		? createLazyComponent(el.element as LazyComponent, el.fallback).Component
		: el.element;
	const currentRoute: RouteItem = {
		...el,
		pattern,
		element: resolvedElement as RenderElement,
		preloadElement,
	};

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

export const isMobile = () => {
	const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
	const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;
	return hasCoarsePointer && isSmallScreen;
};
