import { router } from '../instance';
import { Location, RouteItem } from '../types';
import { WINDOW_LEFT, WINDOW_TOP } from '../constants';

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

export const sleep = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getPartialLoaderArgs = (location: Location) => {
	const params = getParamsObject();
	const { contextState } = router.state;
	const context = contextState.getState();
	const setContext = contextState.setState;
	const searchParams: Record<string, string> = Object.fromEntries(new URLSearchParams(location.search).entries());
	return { params, context, setContext, searchParams, location };
};

export const isVerticalScroll = (el: Element | null) => !!el && el.scrollHeight > el.clientHeight;

export const updateScrollMap = () => {
	const { routeItemDataState, scrollMapState } = router.state;
	const {
		routeItem,
		location: { pathname },
	} = routeItemDataState.getState();
	scrollMapState.setState(prevState => {
		if (Array.isArray(routeItem?.scrollRestoration)) {
			return {
				...prevState,
				[pathname]: routeItem.scrollRestoration.map(key => {
					const el = document.getElementById(key);
					return [key, isVerticalScroll(el) ? el?.scrollTop || 0 : el?.scrollLeft || 0];
				}),
			};
		}
		const scrollingElement = document.scrollingElement;
		const top = scrollingElement?.scrollTop ?? 0;
		const left = scrollingElement?.scrollLeft ?? 0;
		const entries: [string, number][] = [];
		if (top) entries.push([WINDOW_TOP, top]);
		if (left) entries.push([WINDOW_LEFT, left]);
		if (!entries.length) return prevState;
		const prevEntries = prevState[pathname];
		if (prevEntries && JSON.stringify(prevEntries) === JSON.stringify(entries)) return prevState;
		return { ...prevState, [pathname]: entries };
	});
};
