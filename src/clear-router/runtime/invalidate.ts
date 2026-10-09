import { comparePaths } from '../utils/utils';
import { findRoute } from '../utils/findRoute';
import { type InvalidateOptions, InvalidateResult, RevalidateCache, RouteItem, RouterState } from '../types';

const separatePathname = (text: string) => text.split('?')[0];

export const createInvalidate = ({ routeDataState, loaderMap }: RouterState, revalidateCache: RevalidateCache) => {
	const invalidatePath = async (
		routeItem: RouteItem,
		pathname: string,
		options?: InvalidateOptions
	): Promise<InvalidateResult> => {
		const routePathname = routeDataState.getState().location.pathname;
		if (!options?.staleOnly) loaderMap.delete(pathname);
		const [path, search = ''] = pathname.split('?');
		const location = { pathname: path, search };

		const result = await revalidateCache({ routeItem, location });

		if (result && path === routePathname) {
			routeDataState.setState(prevState => ({
				...prevState,
				loaderState: {
					data: result.data,
					loaderError: result.error as Error | null,
					beforeLoadError: null,
				},
				status: result.error ? 'error' : 'active',
			}));
		}

		return { path: pathname, ...result } as InvalidateResult;
	};

	const invalidateItem = async (pathname: string, options?: InvalidateOptions): Promise<InvalidateResult[]> => {
		const routeItem = findRoute(separatePathname(pathname));

		if (!routeItem) return [];

		const pathnameSet = new Set<string>();
		for (const [key] of loaderMap) if (comparePaths(routeItem, separatePathname(key))) pathnameSet.add(key);
		// A path with unresolved :params (e.g. a child pattern expanded during withChildren
		// recursion) addresses nothing fetchable — only already-cached entries make sense,
		// unless fetching is explicitly forced.
		const hasUnresolvedParams = separatePathname(pathname)
			.split('/')
			.some(segment => segment.startsWith(':'));
		const implicitForce = options?.force === undefined && !options?.staleOnly;
		if (options?.force === true || (implicitForce && !hasUnresolvedParams)) pathnameSet.add(pathname);

		const currentResults = await Promise.all(
			[...pathnameSet].map(pathname => invalidatePath(routeItem, pathname, options))
		);

		if (!options?.withChildren || !routeItem.children?.length) return currentResults;

		const [parentPath] = pathname.split('?');
		const childResults = await Promise.all(
			routeItem.children.map(child => invalidateItem(`${parentPath}${child.path}`, options))
		);

		return [...currentResults, ...childResults.flat()];
	};

	return async (pathList?: string | string[], options?: InvalidateOptions) => {
		const { pathname, search } = routeDataState.getState().location;
		const routePathname = `${pathname}${search}`;
		const pathnameList = Array.isArray(pathList) ? pathList : pathList ? [pathList] : [routePathname];
		const result = await Promise.all(pathnameList.map(pathname => invalidateItem(pathname, options)));
		return result.flat();
	};
};
