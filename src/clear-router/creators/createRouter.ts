import { createLazyComponent } from '../utils/createLazyComponent';
import { ClientRouteItem, LAZY_MARKER, LazyComponent, RenderElement, RouteItem } from '../types';

const isLazy = (value: unknown): value is LazyComponent =>
	typeof value === 'object' && value !== null && LAZY_MARKER in value;

const resolve = (
	component: RenderElement | LazyComponent | undefined,
	fallback: ClientRouteItem['fallback']
): RenderElement | undefined =>
	isLazy(component) ? createLazyComponent(component.importFn, fallback).Component : component;

const parseClientRouteItem = (el: ClientRouteItem, parentPattern = ''): RouteItem[] => {
	const pattern = `${parentPattern}/${el.path}`.replace(/\/+/g, '/');
	const preloadElement = isLazy(el.element)
		? createLazyComponent(el.element.importFn, el.fallback).preloadElement
		: undefined;
	const currentRoute: RouteItem = {
		...el,
		pattern,
		element: resolve(el.element, el.fallback),
		errorElement: resolve(el.errorElement, el.fallback),
		preloadElement,
	};

	const childRoutes = el.children?.flatMap(child => parseClientRouteItem(child, pattern)) ?? [];

	return [currentRoute, ...childRoutes];
};

export const createRouter = (clientList: ClientRouteItem[]) => clientList.flatMap(el => parseClientRouteItem(el));
