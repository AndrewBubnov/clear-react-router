import { ReactNode, useMemo, useState } from 'react';
import { Provider } from '../provider/Provider';
import { useHandleNavigation } from '../hooks/useHandleNavigation';
import { useLoader } from '../hooks/useLoader';
import { LoaderState, Location, RouteItem } from '../types/global';

type RouteProviderProps = {
	children: ReactNode;
	routeList: RouteItem[];
	context?: Record<string, unknown>;
};

export const RouterProvider = ({ children, routeList, context: initialContext = {} }: RouteProviderProps) => {
	const [location, setLocation] = useState<Location>({} as Location);
	const [context, setContext] = useState<Record<string, unknown>>(initialContext);
	const [loaderState, setLoaderState] = useState<LoaderState>({});

	const { prefetchLoader, revalidateCache, isLoading } = useLoader({
		routeList,
		context,
		setContext,
		setLoaderState,
	});

	const { blockerState, updateLocation, updateBlockedRoute, routeItemData } = useHandleNavigation({
		setLocation,
		routeList,
		context,
		setContext,
		revalidateCache,
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
			routeItemData,
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
			routeItemData,
		]
	);

	return <Provider {...providerProps}>{children}</Provider>;
};
