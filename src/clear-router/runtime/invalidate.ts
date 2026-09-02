import { comparePaths, getPartialLoaderArgs } from '../utils/utils';
import { findRoute } from '../utils/findRoute';
import { type InvalidateOptions, InvalidateResult, RevalidateCache, RouteItem, RouterState } from '../types';

const redirect = Promise.resolve;

export const createInvalidate = (
	{ routeItemDataState, loaderState, loaderMap, contextState }: RouterState,
	revalidateCache: RevalidateCache
) => {
	const invalidatePath = async (
		routeItem: RouteItem,
		pathname: string,
		options?: InvalidateOptions
	): Promise<InvalidateResult> => {
		const routePathname = routeItemDataState.getState().location.pathname;
		if (!options?.staleOnly) loaderMap.delete(pathname);
		const [path, search = ''] = pathname.split('?');
		const location = { pathname: path, search };
		if (routeItem?.beforeLoad && options?.withBeforeLoad && !options?.staleOnly) {
			try {
				await routeItem.beforeLoad({ redirect, ...getPartialLoaderArgs(contextState, location, routeItem) });
				loaderState.setState(prev => ({ ...prev, beforeLoadError: null }));
			} catch (error) {
				loaderState.setState(prev => ({ ...prev, beforeLoadError: error as Error }));
			}
		}

		const result = await revalidateCache({ routeItem, location });

		if (result && pathname === routePathname)
			loaderState.setState({
				data: result.data,
				loaderError: result.error as Error | null,
				beforeLoadError: null,
			});

		return { path: pathname, ...result } as InvalidateResult;
	};

	const invalidateItem = async (pathname: string, options?: InvalidateOptions): Promise<InvalidateResult[]> => {
		const routeItem = findRoute(pathname.split('?')[0]);

		if (!routeItem) return [];

		const pathnameSet = new Set<string>();
		for (const [key] of loaderMap) if (comparePaths(routeItem, key)) pathnameSet.add(key);
		if (options?.force) pathnameSet.add(pathname);

		const currentResults = await Promise.all(
			[...pathnameSet].map(pathname => invalidatePath(routeItem, pathname, options))
		);

		if (!options?.withChildren || !routeItem.children?.length) return currentResults;

		const childResults = await Promise.all(
			routeItem.children.map(child => invalidateItem(`${pathname}${child.path}`, options))
		);

		return [...currentResults, ...childResults.flat()];
	};

	return async (pathList?: string | string[], options?: InvalidateOptions) => {
		const routePathname = routeItemDataState.getState().location.pathname;
		const pathnameList = Array.isArray(pathList) ? pathList : pathList ? [pathList] : [routePathname];
		const result = await Promise.all(pathnameList.map(pathname => invalidateItem(pathname, options)));
		return result.flat();
	};
};
