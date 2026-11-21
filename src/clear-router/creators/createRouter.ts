import { createLazyComponent } from '../utils/createLazyComponent';
import { NOT_FOUND } from '../utils/findRoute';
import { ClientRouteItem, LAZY_MARKER, LazyComponent, RenderElement, RouteItem } from '../types';

const isLazy = (component: unknown): component is LazyComponent =>
	typeof component === 'object' && component !== null && LAZY_MARKER in component;

const resolve = (component: RenderElement | LazyComponent | undefined, fallback: RenderElement): RenderElement =>
	isLazy(component) ? createLazyComponent(component.importFn, fallback).Component : component;

const warnAboutRepeatedParentPath = (parentPattern: string, el: ClientRouteItem) => {
	if (!import.meta.env.DEV || !parentPattern || parentPattern === '/') return;
	const repeatsParent = el.path === parentPattern || el.path.startsWith(`${parentPattern}/`);
	if (!repeatsParent) return;
	const suggestion = el.path.slice(parentPattern.length) || '/<segment>';
	console.warn(
		`[clear-router] Child route "${el.path}" under "${parentPattern}" repeats the parent prefix. ` +
			`Child paths are appended to the parent pattern — write only the new segment(s), e.g. "${suggestion}".`
	);
};

const parseClientRouteItem = (
	el: ClientRouteItem,
	parentPattern = '',
	inheritedLayouts: RenderElement[] = [],
	inheritedExternalCache?: boolean
): RouteItem[] => {
	warnAboutRepeatedParentPath(parentPattern, el);
	const pattern = `${parentPattern}/${el.path}`.replace(/\/+/g, '/');
	const preloadElement = isLazy(el.element)
		? createLazyComponent(el.element.importFn, el.fallback).preloadElement
		: undefined;
	const layouts = el.layout ? [...inheritedLayouts, el.layout] : inheritedLayouts;
	const externalCache = el.externalCache ?? inheritedExternalCache;
	const currentRoute: RouteItem = {
		...el,
		externalCache,
		pattern,
		element: resolve(el.element, el.fallback),
		errorElement: resolve(el.errorElement, el.fallback),
		preloadElement,
		layouts,
	};

	const childRoutes =
		el.children?.flatMap(child => parseClientRouteItem(child, pattern, layouts, externalCache)) ?? [];

	return [currentRoute, ...childRoutes];
};

const warnAboutShadowedRoutes = (routes: RouteItem[]) => {
	if (!import.meta.env.DEV) return;
	const segments = (pattern: string) => pattern.split('/').filter(Boolean);
	const isParam = (segment: string) => segment.startsWith(':');
	// Two same-length patterns overlap in matched pathnames when every position
	// pair is (param, anything) or equal statics.
	const compatible = (earlier: string, later: string) => isParam(earlier) || isParam(later) || earlier === later;
	// `later` can win a pathname that also matches `earlier` when it is static
	// where `earlier` is a parameter (the positional-specificity rule).
	const isMoreSpecific = (a: string[], b: string[]) => a.some((segment, k) => !isParam(segment) && isParam(b[k]));

	for (let j = 1; j < routes.length; j++) {
		const later = segments(routes[j].pattern);
		for (let i = 0; i < j; i++) {
			if (routes[i].path === NOT_FOUND || routes[j].path === NOT_FOUND) continue;
			const earlier = segments(routes[i].pattern);
			if (earlier.length !== later.length) continue;
			if (!earlier.every((segment, k) => compatible(segment, later[k]))) continue;
			if (isMoreSpecific(later, earlier)) {
				console.warn(
					`[clear-router] Route "${routes[j].pattern}" is shadowed by "${routes[i].pattern}" declared earlier ` +
						'(the first matching route wins) and is therefore unreachable. ' +
						'Declare the more specific/static route first.'
				);
				break;
			}
			if (!isMoreSpecific(earlier, later)) {
				console.warn(
					`[clear-router] Routes "${routes[i].pattern}" and "${routes[j].pattern}" have the same match shape — ` +
						'the second one is unreachable. Remove the duplicate.'
				);
				break;
			}
		}
	}

	const catchAllIndex = routes.findIndex(route => route.path === NOT_FOUND);
	if (catchAllIndex !== -1 && catchAllIndex !== routes.length - 1)
		console.warn(
			`[clear-router] Catch-all route "${NOT_FOUND}" is not declared last: it matches every pathname ` +
				'(the first matching route wins) and shadows all routes declared after it.'
		);
};

export const createRouter = (clientList: ClientRouteItem[]) => {
	const routes = clientList.flatMap(el => parseClientRouteItem(el));
	warnAboutShadowedRoutes(routes);
	return routes;
};
