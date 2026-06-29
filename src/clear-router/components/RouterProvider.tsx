import { ReactNode, useMemo, useState } from 'react';
import { Provider } from '../provider/Provider';
import { useHandleNavigation } from '../hooks/useHandleNavigation';
import { useLoader } from '../hooks/useLoader';
import { LoaderState, RouteItem } from '../types/global';

type RouteProviderProps = {
	children: ReactNode;
	routeList: RouteItem[];
	context?: Record<string, unknown>;
};

export const RouterProvider = ({ children, routeList, context: initialContext = {} }: RouteProviderProps) => {
	const [context, setContext] = useState<Record<string, unknown>>(initialContext);
	const [loaderState, setLoaderState] = useState<LoaderState>({} as LoaderState);

	const { prefetchLoader, revalidateCache, isLoading } = useLoader({
		routeList,
		context,
		setContext,
		setLoaderState,
	});

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
		setLoaderState,
	});

	const providerProps = useMemo(
		() => ({
			setSearch,
			updateLocation,
			loaderState,
			prefetchLoader,
			updateBlockedRoute,
			blockerState,
			context,
			setContext,
			routeList,
			routeItemData,
			restoreScroll,
			currentLoaderFallback,
			isLoading,
		}),
		[
			blockerState,
			context,
			isLoading,
			loaderState,
			prefetchLoader,
			routeItemData,
			routeList,
			setSearch,
			updateBlockedRoute,
			updateLocation,
			currentLoaderFallback,
			restoreScroll,
		]
	);

	return <Provider {...providerProps}>{children}</Provider>;
};
