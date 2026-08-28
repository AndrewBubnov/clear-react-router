import { createLazyComponent } from './createLazyComponent';
import { ClientRouteItem, LAZY_MARKER, LazyComponent, RenderElement, RouteItem } from '../types';

const isLazy = (el: ClientRouteItem): el is ClientRouteItem & { element: LazyComponent } =>
	typeof el.element === 'object' && el.element !== null && LAZY_MARKER in el.element;

const parseClientRouteItem = (el: ClientRouteItem, parentPattern = ''): RouteItem[] => {
	const pattern = `${parentPattern}/${el.path}`.replace(/\/+/g, '/');
	const preloadElement = isLazy(el)
		? createLazyComponent(el.element.importFn, el.fallback).preloadElement
		: undefined;
	const resolvedElement = isLazy(el) ? createLazyComponent(el.element.importFn, el.fallback).Component : el.element;
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
