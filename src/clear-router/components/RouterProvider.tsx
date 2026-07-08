import { ReactNode, useMemo, useState } from 'react';
import { Provider } from '../provider/Provider';
import { useHandleNavigation } from '../hooks/useHandleNavigation';
import { useLoader } from '../hooks/useLoader';
import { RouteItem } from '../types/global';

type RouteProviderProps = {
	children: ReactNode;
	routes: RouteItem[];
	context?: Record<string, unknown>;
};

export const RouterProvider = ({ children, routes, context: initialContext = {} }: RouteProviderProps) => {
	const [context, setContext] = useState<Record<string, unknown>>(initialContext);

	const { prefetchLoader, revalidateCache, isCacheItemFresh, loaderStateRef, clearTimestamp } = useLoader({
		routes,
		context,
		setContext,
	});

	const {
		blockerState,
		updateLocation,
		updateBlockedRoute,
		routeItemData,
		restoreScroll,
		currentLoaderFallback,
		isLoading,
		loaderState,
		invalidate,
	} = useHandleNavigation({
		routes,
		context,
		setContext,
		revalidateCache,
		isCacheItemFresh,
		loaderStateRef,
		clearTimestamp,
	});

	const providerProps = useMemo(
		() => ({
			updateLocation,
			prefetchLoader,
			updateBlockedRoute,
			blockerState,
			context,
			setContext,
			routeItemData,
			restoreScroll,
			currentLoaderFallback,
			isLoading,
			loaderState,
			invalidate,
		}),
		[
			blockerState,
			context,
			prefetchLoader,
			routeItemData,
			updateBlockedRoute,
			updateLocation,
			currentLoaderFallback,
			restoreScroll,
			isLoading,
			loaderState,
			invalidate,
		]
	);

	return <Provider {...providerProps}>{children}</Provider>;
};
