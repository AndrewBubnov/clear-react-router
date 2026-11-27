import { handleBackgroundFailure } from './backgroundError';
import { findRoute } from '../utils/findRoute';
import { isParamSegment, matchPathPattern, splitPathAndSearch, toCacheKey } from '../utils/utils';
import { type InvalidateOptions, InvalidateResult, RevalidateCache, RouteItem, RouterState } from '../types';

// A miss is legal (unknown/pattern paths), so the dev hint fires once per path.
const missedInvalidationWarnings = new Set<string>();
export const resetMissedInvalidationWarnings = () => missedInvalidationWarnings.clear();

const separatePathname = (text: string) => text.split('?')[0].replace(/\/+$/, '') || '/';

const normalizePath = (text: string) => toCacheKey(text);

export const createInvalidate = (
	{ routeDataState, loaderMap, loadingPromises }: RouterState,
	revalidateCache: RevalidateCache,
	syncCacheSnapshot: () => void
) => {
	const invalidatePath = async (
		routeItem: RouteItem,
		pathname: string,
		options?: InvalidateOptions
	): Promise<InvalidateResult> => {
		if (!options?.staleOnly) {
			loaderMap.delete(pathname);
			syncCacheSnapshot();
			await loadingPromises.get(pathname);
		}
		// Location.search carries its leading '?' everywhere downstream.
		const [path, search] = splitPathAndSearch(pathname);
		const location = { pathname: path, search };

		const result = await revalidateCache({
			routeItem,
			location,
			reason: 'invalidate',
			force: !options?.staleOnly,
		});

		const activeLocation = routeDataState.getState().location;
		if (result && normalizePath(pathname) === normalizePath(`${activeLocation.pathname}${activeLocation.search}`)) {
			if (result.error) {
				// A background failure keeps displayed data and reports instead of swapping
				// the page; without displayed data the errorElement path stays.
				const keptData = handleBackgroundFailure(
					loaderMap,
					pathname,
					result.error as Error,
					routeItem,
					routeDataState.getState().loaderState.data,
					syncCacheSnapshot
				);
				routeDataState.setState(prevState => ({
					...prevState,
					loaderState: {
						data: keptData ?? null,
						loaderError: result.error as Error | null,
						beforeLoadError: null,
					},
					status: keptData != null ? 'active' : 'error',
				}));
			} else {
				routeDataState.setState(prevState => ({
					...prevState,
					loaderState: {
						data: result.data,
						loaderError: null,
						beforeLoadError: null,
					},
					status: 'active',
				}));
			}
		}

		return { path: pathname, matched: true, ...result } as InvalidateResult;
	};

	const invalidateItem = async (rawPathname: string, options?: InvalidateOptions): Promise<InvalidateResult[]> => {
		const pathname = toCacheKey(rawPathname);
		const routeItem = findRoute(separatePathname(pathname));

		if (!routeItem) {
			if (import.meta.env.DEV && !missedInvalidationWarnings.has(pathname)) {
				missedInvalidationWarnings.add(pathname);
				console.warn(
					`[clear-react-router] invalidate("${rawPathname}") matched no route. Paths are route templates like '/projects/:projectId', not concrete URLs.`
				);
			}
			return [{ path: rawPathname, matched: false, data: null, error: null }];
		}

		const targetPathname = separatePathname(pathname);
		const isPattern = targetPathname.split('/').filter(Boolean).some(isParamSegment);

		const pathnameSet = new Set<string>();
		for (const [key] of loaderMap) {
			const keyPathname = separatePathname(key);
			const matches = isPattern ? matchPathPattern(targetPathname, keyPathname) : keyPathname === targetPathname;
			if (matches) pathnameSet.add(key);
		}
		const implicitForce = options?.force === undefined && !options?.staleOnly;
		if (!isPattern && (options?.force === true || implicitForce)) pathnameSet.add(pathname);

		const currentResults = await Promise.all(
			[...pathnameSet].map(pathname => invalidatePath(routeItem, pathname, options))
		);

		if (!options?.withChildren || !routeItem.children?.length) return currentResults;

		const [parentPath] = pathname.split('?');
		// Child paths are authored relative ('details'), but may carry a leading
		// slash — join and collapse so both forms resolve to '/users/details'.
		const childResults = await Promise.all(
			routeItem.children.map(child =>
				invalidateItem(`${parentPath}/${child.path}`.replace(/\/{2,}/g, '/'), options)
			)
		);

		return [...currentResults, ...childResults.flat()];
	};

	return async (pathList?: string | string[], options?: InvalidateOptions) => {
		const { pathname, search } = routeDataState.getState().location;
		const routePathname = toCacheKey(`${pathname}${search}`);
		const pathnameList = Array.isArray(pathList) ? pathList : pathList ? [pathList] : [routePathname];
		const result = await Promise.all(pathnameList.map(pathname => invalidateItem(pathname, options)));
		return result.flat();
	};
};
