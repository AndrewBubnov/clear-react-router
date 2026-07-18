import { currentLoaderState, routeItemDataState } from '../state/state';
import { revalidateCache } from '../utils/revalidateCache';
import { comparePaths, getParamsObject } from '../utils/utils';
import { getContext } from '../utils/getContext';
import { findRoute } from '../utils/findRoute';
import { loaderStateRef, timestampMap } from '../cell';
import { RouteItem } from '../types/global';

type Options = { withChildren?: boolean };

const redirect = () => Promise.resolve();

const invalidatePath = async (routeItem: RouteItem, pathname: string) => {
	const routePathname = routeItemDataState.getState().location.pathname;
	timestampMap.delete(pathname);
	const params = getParamsObject({ params: routeItem?.params, pathname });
	try {
		if (routeItem?.beforeLoad) {
			const { context, setContext } = getContext();
			await routeItem.beforeLoad({ context, redirect, params, setContext });
		}
		loaderStateRef.set(prev => ({ ...prev, beforeLoadError: null }));
	} catch (error) {
		loaderStateRef.set(prev => ({ ...prev, beforeLoadError: error as Error }));
	}
	await revalidateCache({ routeItem, pathname });
	if (pathname === routePathname) currentLoaderState.setState(loaderStateRef.value);
};

const invalidateItem = async (pathname: string, withChildren?: boolean) => {
	const routeItem = findRoute(pathname);
	if (!routeItem) return;
	const pathnameArray: string[] = [];
	for (const [key] of timestampMap) if (comparePaths(routeItem, key)) pathnameArray.push(key);
	await Promise.all(pathnameArray.map(pathname => invalidatePath(routeItem, pathname)));
	if (withChildren && routeItem.children?.length) {
		const childPathList = routeItem.children.map(el => el.path);
		await Promise.all(childPathList.map(el => invalidateItem(`${pathname}${el}`, withChildren)));
	}
};

export const invalidate = async (pathList?: string | string[], options?: Options) => {
	const routePathname = routeItemDataState.getState().location.pathname;
	const pathnameList = Array.isArray(pathList) ? pathList : pathList ? [pathList] : [routePathname];
	await Promise.all(pathnameList.map(pathname => invalidateItem(pathname, options?.withChildren)));
};
