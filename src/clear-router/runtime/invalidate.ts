import { comparePaths } from '../utils/utils';
import { findRoute } from '../utils/findRoute';
import { type InvalidateOptions, InvalidateResult, RevalidateCache, RouteItem, RouterState } from '../types';

const separatePathname = (text: string) => text.split('?')[0];

export const createInvalidate = (
	{ routeItemDataState, loaderState, loaderMap }: RouterState,
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

		const result = await revalidateCache({ routeItem, location });

		if (result && path === routePathname)
			loaderState.setState({
				data: result.data,
				loaderError: result.error as Error | null,
				beforeLoadError: null,
			});

		return { path: pathname, ...result } as InvalidateResult;
	};

	const invalidateItem = async (pathname: string, options?: InvalidateOptions): Promise<InvalidateResult[]> => {
		const routeItem = findRoute(separatePathname(pathname));

		if (!routeItem) return [];

		const pathnameSet = new Set<string>();
		for (const [key] of loaderMap) if (comparePaths(routeItem, separatePathname(key))) pathnameSet.add(key);
		if (options?.force) pathnameSet.add(pathname);

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
		const { pathname, search } = routeItemDataState.getState().location;
		const routePathname = `${pathname}${search}`;
		const pathnameList = Array.isArray(pathList) ? pathList : pathList ? [pathList] : [routePathname];
		const result = await Promise.all(pathnameList.map(pathname => invalidateItem(pathname, options)));
		return result.flat();
	};
};
