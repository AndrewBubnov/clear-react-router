import { ReactNode, useMemo, useState } from 'react';
import { Provider } from '../provider/Provider';
import { useHandleNavigation } from '../hooks/useHandleNavigation';
import { useLoader } from '../hooks/useLoader';
import { usePreserveScroll } from '../hooks/usePreserveScroll';
import { LoaderState, Location, RouteItem } from '../types/global';

type RouteProviderProps = {
	children: ReactNode;
	routeList: RouteItem[];
	context?: Record<string, unknown>;
	preserveScroll?: boolean;
};

export const RouterProvider = ({
	children,
	routeList,
	context: initialContext = {},
	preserveScroll = true,
}: RouteProviderProps) => {
	const [location, setLocation] = useState<Location>({} as Location);
	const [context, setContext] = useState<Record<string, unknown>>(initialContext);
	const [loaderState, setLoaderState] = useState<LoaderState>({});

	const setScrollMap = usePreserveScroll({ pathname: location.pathname, preserveScroll });

	const { prefetchLoader, revalidateCache, isLoading } = useLoader({
		routeList,
		context,
		setContext,
		setLoaderState,
	});

	const { blockerState, updateLocation, updateBlockedRoute, nextRouteItem } = useHandleNavigation({
		setLocation,
		routeList,
		context,
		setContext,
		revalidateCache,
		setScrollMap,
		setLoaderState,
	});

	const providerProps = useMemo(
		() => ({
			location,
			setLocation,
			updateLocation,
			loaderState,
			prefetchLoader,
			updateBlockedRoute,
			blockerState,
			context,
			setContext,
			routeList,
			nextRouteItem,
			isLoading,
		}),
		[
			blockerState,
			context,
			isLoading,
			loaderState,
			location,
			prefetchLoader,
			routeList,
			updateBlockedRoute,
			updateLocation,
			nextRouteItem,
		]
	);

	return <Provider {...providerProps}>{children}</Provider>;
};
