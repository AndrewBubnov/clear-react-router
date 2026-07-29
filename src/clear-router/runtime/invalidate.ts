import { comparePaths, getParamsObject } from '../utils/utils';
import { findRoute } from '../utils/findRoute';
import { type InvalidateOptions, RevalidateCache, RouteItem, RouterState } from '../types';

const redirect = () => Promise.resolve();

export const createInvalidate = (
	{ routeItemDataState, loaderStateRef, timestampMap, currentLoaderState, contextState }: RouterState,
	revalidateCache: RevalidateCache
) => {
	const invalidatePath = async (routeItem: RouteItem, pathname: string, options?: InvalidateOptions) => {
		const routePathname = routeItemDataState.getState().location.pathname;
		timestampMap.delete(pathname);
		const params = getParamsObject({
			params: routeItem?.params,
			pathname,
		});

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

		await revalidateCache({
			routeItem,
			pathname,
		});

		if (pathname === routePathname) currentLoaderState.setState(loaderStateRef.value);
	};

	const invalidateItem = async (pathname: string, options?: InvalidateOptions) => {
		const routeItem = findRoute(pathname);

		if (!routeItem) return;

		const pathnameArray: string[] = [];
		for (const [key] of timestampMap) if (comparePaths(routeItem, key)) pathnameArray.push(key);

		await Promise.all(pathnameArray.map(pathname => invalidatePath(routeItem, pathname, options)));

		if (options?.withChildren && routeItem.children?.length) {
			const childPathList = routeItem.children.map(el => el.path);
			await Promise.all(childPathList.map(el => invalidateItem(`${pathname}${el}`, options)));
		}
	};

	return async (pathList?: string | string[], options?: InvalidateOptions) => {
		const routePathname = routeItemDataState.getState().location.pathname;
		const pathnameList = Array.isArray(pathList) ? pathList : pathList ? [pathList] : [routePathname];
		await Promise.all(pathnameList.map(pathname => invalidateItem(pathname, options)));
	};
};
