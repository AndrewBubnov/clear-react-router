import type { ReactElement } from 'react';
import { createLazyComponent } from './createLazyComponent';
import { create } from '../state/createState';
import { Cell } from '../cell';
import { emptyLoaderState } from '../constants';
import {
	ClientRouteItem,
	LazyComponent,
	LoaderState,
	Location,
	RouteItem,
	RouteItemData,
	RouterType,
} from '../types/global';

const isLazy = (el: ClientRouteItem) => typeof el.element === 'function' && el.element.toString().includes('import(');

const parseClientRouteItem = (
	el: ClientRouteItem,
	parentParams: RouteItem['params'] = [],
	parentPath = ''
): RouteItem[] => {
	const segments = el.path.split('/').filter(Boolean);
	const staticSegments: string[] = [];
	const currentParams: RouteItem['params'] = [...parentParams];

	let lastStaticSegment = '';

	for (const segment of segments) {
		if (segment.startsWith(':')) {
			if (!lastStaticSegment) throw new Error(`Route "${el.path}" cannot start with a parameter.`);

			currentParams.push({
				key: lastStaticSegment,
				value: segment.slice(1),
			});
		} else {
			lastStaticSegment = segment;
			staticSegments.push(segment);
		}
	}

	const path = `${parentPath}/${staticSegments.join('/')}`.replace(/\/+/g, '/');
	const resolvedElement = isLazy(el) ? createLazyComponent(el.element as LazyComponent, el.fallback) : el.element;
	const currentRoute: RouteItem = {
		...el,
		path,
		params: currentParams,
		element: resolvedElement as (() => ReactElement) | ReactElement,
	};

	const childRoutes = el.children?.flatMap(child => parseClientRouteItem(child, currentParams, path)) ?? [];

	return [currentRoute, ...childRoutes];
};

export const createRouter = (clientList: ClientRouteItem[]): RouterType => ({
	routes: clientList.flatMap(el => parseClientRouteItem(el, [])),
	state: {
		contextState: create<Record<string, unknown>>({}),
		isLoadingState: create<boolean>(false),
		loaderFallbackState: create<RouteItem['loaderFallback']>(undefined),
		currentLoaderState: create<LoaderState>(emptyLoaderState),
		routeItemDataState: create<RouteItemData>({
			routeItem: undefined,
			location: {} as Location,
		}),
		scrollMapState: create<Record<string, number>>({}),
	},
	cell: {
		loaderStateRef: new Cell(emptyLoaderState),
		prevPathnameRef: new Cell(''),
		timestampMap: new Map<string, number>(),
	},
});

export const getParamsObject = ({ params, pathname }: { params?: RouteItem['params']; pathname: string }) => {
	if (!params) return {};
	const split = pathname.split('/');
	return (params || [])
		.map(el => ({ index: split.findIndex(item => item === el.key), value: el.value }))
		.reduce((acc, cur) => ({ ...acc, [cur.value]: split[cur.index + 1] }), {});
};

export const parseWindowLocation = (location: typeof window.location): Location => ({
	pathname: location.pathname,
	search: location.search,
});

export const comparePaths = (el: RouteItem, pathname: string) => {
	const splitElementPath = el.path.split('/').filter(Boolean);
	const paramsLength = el.params ? Object.keys(el.params).length : 0;
	const splitPathname = pathname.split('/').filter(Boolean);
	return (
		splitElementPath.every((item, index) => item === splitPathname[2 * index]) &&
		splitPathname.length === splitElementPath.length + paramsLength
	);
};
