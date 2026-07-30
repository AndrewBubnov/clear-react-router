import { comparePaths, getParamsObject } from '../utils/utils';
import { findRoute } from '../utils/findRoute';
import { type InvalidateOptions, RevalidateCache, RouteItem, RouterState } from '../types';

const redirect = () => Promise.resolve();

type Result = { path: string; data: unknown };

export const createInvalidate = (
	{ routeItemDataState, loaderStateRef, timestampMap, currentLoaderState, contextState }: RouterState,
	revalidateCache: RevalidateCache
) => {
	const invalidatePath = async (
		routeItem: RouteItem,
		pathname: string,
		options?: InvalidateOptions
	): Promise<Result> => {
		const routePathname = routeItemDataState.getState().location.pathname;
		timestampMap.delete(pathname);
		const params = getParamsObject();

		try {
			if (routeItem?.beforeLoad && options?.withBeforeLoad) {
				const context = contextState.getState();
				const setContext = contextState.setState;
				await routeItem.beforeLoad({ context, redirect, params, setContext });
			}
			loaderStateRef.set(prev => ({ ...prev, beforeLoadError: null }));
		} catch (error) {
			loaderStateRef.set(prev => ({ ...prev, beforeLoadError: error as Error }));
		}

		const result = await revalidateCache({ routeItem, pathname });

		if (pathname === routePathname) currentLoaderState.setState(loaderStateRef.value);
		return { path: pathname, data: result };
	};

	const invalidateItem = async (pathname: string, options?: InvalidateOptions): Promise<Result[]> => {
		const routeItem = findRoute(pathname);

		if (!routeItem) return [];

		const pathnameArray: string[] = [];
		for (const [key] of timestampMap) if (comparePaths(routeItem, key)) pathnameArray.push(key);

		const currentResults = await Promise.all(
			pathnameArray.map(pathname => invalidatePath(routeItem, pathname, options))
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

		return result.flat().reduce(
			(acc, cur) => {
				if (!cur) return acc;
				acc[cur.path] = cur.data;
				return acc;
			},
			{} as Record<string, unknown>
		);
	};
};
