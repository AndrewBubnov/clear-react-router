import type { LoaderState, RevalidateCacheArgs } from '../types/global';
import { isCacheItemFresh } from './isCacheItemFresh';
import { getParamsObject } from './utils';
import { getContext } from './getContext';
import { loaderStateRef, timestampMap } from '../cell';

const loaderMapRef: Record<string, LoaderState> = {};
const loadingPromises: Map<string, Promise<unknown>> = new Map();

const revalidateCache = ({ routeItem, pathname }: RevalidateCacheArgs) => {
	if (!routeItem?.loader) return;

	if (loadingPromises.has(pathname)) return loadingPromises.get(pathname);

	if (isCacheItemFresh({ routeItem, pathname })) {
		loaderStateRef.set(loaderMapRef[pathname]);
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

export { revalidateCache };
