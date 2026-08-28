import { comparePaths, getParamsObject } from '../utils/utils';
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
		loaderMap.delete(pathname);
		const params = getParamsObject();
		if (routeItem?.beforeLoad && options?.withBeforeLoad) {
			try {
				const context = contextState.getState();
				const setContext = contextState.setState;
				await routeItem.beforeLoad({ context, redirect, params, setContext });
				loaderState.setState(prev => ({ ...prev, beforeLoadError: null }));
			} catch (error) {
				loaderState.setState(prev => ({ ...prev, beforeLoadError: error as Error }));
			}
		}

		const result = await revalidateCache({ routeItem, pathname });

		if (result && pathname === routePathname)
			loaderState.setState({
				data: result.data,
				loaderError: result.error as Error | null,
				beforeLoadError: null,
			});

		return { path: pathname, ...result } as InvalidateResult;
	};

	const invalidateItem = async (pathname: string, options?: InvalidateOptions): Promise<InvalidateResult[]> => {
		const routeItem = findRoute(pathname);

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
