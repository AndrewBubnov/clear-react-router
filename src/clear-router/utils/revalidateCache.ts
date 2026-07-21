import { getParamsObject } from './utils';
import { IsCacheItemFresh, LoaderState, RevalidateCacheArgs, RouterState } from '../types';

type RevalidateCache = RouterState & {
	isCacheItemFresh: IsCacheItemFresh;
	loaderMapRef: Record<string, LoaderState>;
	loadingPromises: Map<string, Promise<unknown>>;
};

export const createRevalidateCache =
	({
		loaderStateRef,
		timestampMap,
		isCacheItemFresh,
		loaderMapRef,
		loadingPromises,
		contextState,
	}: RevalidateCache) =>
	({ routeItem, pathname }: RevalidateCacheArgs) => {
		if (!routeItem?.loader) return;

		if (loadingPromises.has(pathname)) return loadingPromises.get(pathname);

		if (isCacheItemFresh({ routeItem, pathname })) {
			loaderStateRef.set(loaderMapRef[pathname]);
			return;
		}

		const promise = (async () => {
			if (!routeItem?.loader) return;
			try {
				const context = contextState.getState();
				const setContext = contextState.setState;
				const params: Record<string, string> = getParamsObject({ params: routeItem.params, pathname });
				const result = await routeItem?.loader({
					params,
					context,
					setContext,
				});
				timestampMap.set(pathname, Date.now());
				loaderStateRef.set(prev => ({ ...prev, data: result, loaderError: null }));
				loaderMapRef[pathname] = loaderStateRef.value;
			} catch (error) {
				loaderStateRef.set(prev => ({ ...prev, data: null, loaderError: error as Error }));
			} finally {
				loadingPromises.delete(pathname);
			}
		})();

		loadingPromises.set(pathname, promise);
		return promise;
	};
