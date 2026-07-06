import { ReactNode, useMemo, useState } from 'react';
import { Provider } from '../provider/Provider';
import { useHandleNavigation } from '../hooks/useHandleNavigation';
import { useLoader } from '../hooks/useLoader';
import { RouteItem } from '../types/global';

type RouteProviderProps = {
	children: ReactNode;
	routeList: RouteItem[];
	context?: Record<string, unknown>;
};

export const RouterProvider = ({ children, routeList, context: initialContext = {} }: RouteProviderProps) => {
	const [context, setContext] = useState<Record<string, unknown>>(initialContext);

	const { prefetchLoader, revalidateCache, isCacheItemFresh, loaderStateRef } = useLoader({
		routeList,
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
	} = useHandleNavigation({
		routeList,
		context,
		setContext,
		revalidateCache,
		isCacheItemFresh,
		loaderStateRef,
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
		]
	);

	return <Provider {...providerProps}>{children}</Provider>;
};
