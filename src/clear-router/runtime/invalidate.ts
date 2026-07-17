import { currentLoaderState, routeItemDataState } from '../state/state';
import { revalidateCache } from '../utils/revalidateCache';
import { comparePaths, getParamsObject } from '../utils/utils';
import { routerConfig } from '../config/routerConfig';
import { getContext } from '../utils/getContext';
import { loaderStateRef, timestampMap } from '../cell';

export const invalidate = async (path?: string) => {
	const routePathname = routeItemDataState.getState().location.pathname;
	const pathname = path || routePathname;
	const routeItem = routerConfig.routes.find(el => comparePaths(el, pathname));
	const resultParams = getParamsObject({
		params: routeItem?.params,
		pathname,
	});
	timestampMap.delete(pathname);
	try {
		if (routeItem?.beforeLoad) {
			const { context, setContext } = getContext();
			await routeItem.beforeLoad({
				context,
				redirect: () => Promise.resolve(),
				params: resultParams,
				setContext,
			});
		}
		loaderStateRef.set(prev => ({ ...prev, beforeLoadError: null }));
	} catch (error) {
		loaderStateRef.set(prev => ({ ...prev, beforeLoadError: error as Error }));
	}

	await revalidateCache({ routeItem, pathname: pathname });
	if (pathname === routePathname) currentLoaderState.setState(loaderStateRef.value);
};
