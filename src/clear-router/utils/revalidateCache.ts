import type { LoaderState, RevalidateCacheArgs } from '../types/global';
import { emptyLoaderState } from '../constants';
import { isCacheItemFresh, timestampMap } from './isCacheItemFresh';
import { getParamsObject } from './utils';
import { getContext } from './getContext';

const loaderMapRef: Record<string, LoaderState> = {};
const loadingPromises: Map<string, Promise<unknown>> = new Map();
const loaderStateRef: Record<'current', LoaderState> = { current: emptyLoaderState };

const revalidateCache = ({ routeItem, pathname }: RevalidateCacheArgs) => {
	if (!routeItem?.loader) return;

	if (loadingPromises.has(pathname)) return loadingPromises.get(pathname);

	if (isCacheItemFresh({ routeItem, pathname })) {
		loaderStateRef.current = loaderMapRef[pathname];
		return;
	}

	const promise = (async () => {
		if (!routeItem?.loader) return;
		try {
			const { context, setContext } = getContext();
			const params: Record<string, string> = getParamsObject({ params: routeItem.params, pathname });
			const result = await routeItem?.loader({
				params,
				context,
				setContext,
			});
			timestampMap.set(pathname, Date.now());
			loaderStateRef.current = { ...loaderStateRef?.current, data: result, loaderError: null };
			loaderMapRef[pathname] = loaderStateRef.current;
		} catch (error) {
			loaderStateRef.current = { ...loaderStateRef?.current, data: null, loaderError: error as Error };
		} finally {
			loadingPromises.delete(pathname);
		}
	})();

	loadingPromises.set(pathname, promise);
	return promise;
};

export { revalidateCache, loaderStateRef };
