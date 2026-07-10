import { ReactNode, useMemo } from 'react';
import { Provider } from '../provider/Provider';
import { useHandleNavigation } from '../hooks/useHandleNavigation';
import { useLoader } from '../hooks/useLoader';
import { RouteItem } from '../types/global';

type RouteProviderProps = {
	children: ReactNode;
	routes: RouteItem[];
};

export const RouterProvider = ({ children, routes }: RouteProviderProps) => {
	const { prefetchLoader, revalidateCache, isCacheItemFresh, loaderStateRef, invalidate } = useLoader(routes);

	const { updateLocation, updateBlockedRoute } = useHandleNavigation({
		routes,
		revalidateCache,
		isCacheItemFresh,
		loaderStateRef,
	});

	const providerProps = useMemo(
		() => ({
			updateLocation,
			prefetchLoader,
			updateBlockedRoute,
			invalidate,
		}),
		[prefetchLoader, updateBlockedRoute, updateLocation, invalidate]
	);

	return <Provider {...providerProps}>{children}</Provider>;
};
