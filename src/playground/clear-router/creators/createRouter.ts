import { createLazyComponent } from '../utils/createLazyComponent';
import { ClientRouteItem, LAZY_MARKER, LazyComponent, RenderElement, RouteItem } from '../types';

const isLazy = (component: unknown): component is LazyComponent =>
	typeof component === 'object' && component !== null && LAZY_MARKER in component;

const resolve = (component: RenderElement | LazyComponent | undefined, fallback: RenderElement): RenderElement =>
	isLazy(component) ? createLazyComponent(component.importFn, fallback).Component : component;

const parseClientRouteItem = (
	el: ClientRouteItem,
	parentPattern = '',
	inheritedLayouts: RenderElement[] = []
): RouteItem[] => {
	const pattern = `${parentPattern}/${el.path}`.replace(/\/+/g, '/');
	const preloadElement = isLazy(el.element)
		? createLazyComponent(el.element.importFn, el.fallback).preloadElement
		: undefined;
	const layouts = el.layout ? [...inheritedLayouts, el.layout] : inheritedLayouts;
	const currentRoute: RouteItem = {
		...el,
		pattern,
		element: resolve(el.element, el.fallback),
		errorElement: resolve(el.errorElement, el.fallback),
		preloadElement,
		layouts,
	};

	const childRoutes = el.children?.flatMap(child => parseClientRouteItem(child, pattern, layouts)) ?? [];

	return [currentRoute, ...childRoutes];
};

export const createRouter = (clientList: ClientRouteItem[]) => clientList.flatMap(el => parseClientRouteItem(el));
