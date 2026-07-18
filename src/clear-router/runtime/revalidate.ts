import { currentLoaderState, routeItemDataState } from '../state/state';
import { revalidateCache } from '../utils/revalidateCache';
import { comparePaths, getParamsObject } from '../utils/utils';
import { getContext } from '../utils/getContext';
import { findRoute } from '../utils/findRoute';
import { loaderStateRef, timestampMap } from '../cell';
import { RouteItem } from '../types/global';

const redirect = () => Promise.resolve();

const revalidateKey = async (routeItem: RouteItem, pathname: string, routePathname: string) => {
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
	await revalidateCache({ routeItem, pathname: pathname });
	if (pathname === routePathname) currentLoaderState.setState(loaderStateRef.value);
};

export const revalidateItem = async (pathname: string, routePathname: string) => {
	const routeItem = findRoute(pathname);
	if (!routeItem) return;
	const pathnameArray: string[] = [];
	for (const [key] of timestampMap) if (comparePaths(routeItem, key)) pathnameArray.push(key);
	pathnameArray.forEach(el => revalidateKey(routeItem, el, routePathname));
};

export const revalidate = async (pathList?: string | string[]) => {
	const routePathname = routeItemDataState.getState().location.pathname;
	const pathnameList = Array.isArray(pathList) ? pathList : pathList ? [pathList] : [routePathname];
	pathnameList.forEach(el => revalidateItem(el, routePathname));
};
