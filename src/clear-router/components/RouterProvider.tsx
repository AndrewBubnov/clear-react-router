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

	const { prefetchLoader, revalidateCache, isCacheItemFresh } = useLoader({ routeList, context, setContext });

	const {
		blockerState,
		updateLocation,
		updateBlockedRoute,
		routeItemData,
		setSearch,
		restoreScroll,
		currentLoaderFallback,
	} = useHandleNavigation({
		routeList,
		context,
		setContext,
		revalidateCache,
		isCacheItemFresh,
	});

	const providerProps = useMemo(
		() => ({
			setSearch,
			updateLocation,
			prefetchLoader,
			updateBlockedRoute,
			blockerState,
			context,
			setContext,
			routeItemData,
			restoreScroll,
			currentLoaderFallback,
		}),
		[
			blockerState,
			context,
			prefetchLoader,
			routeItemData,
			setSearch,
			updateBlockedRoute,
			updateLocation,
			currentLoaderFallback,
			restoreScroll,
		]
	);

	return <Provider {...providerProps}>{children}</Provider>;
};
