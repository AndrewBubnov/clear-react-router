import { ReactNode } from 'react';
import { Provider } from '../provider/Provider';
import { useNavigation } from '../hooks/useNavigation.ts';
import { useLoader } from '../hooks/useLoader';
import { RouteItem } from '../types/global';

type RouteProviderProps = {
	children: ReactNode;
	routes: RouteItem[];
};

export const RouterProvider = ({ children, routes }: RouteProviderProps) => {
	const { prefetchLoader, revalidateCache, isCacheItemFresh, loaderStateRef, invalidate } = useLoader(routes);

	const updateLocation = useNavigation({
		routes,
		revalidateCache,
		isCacheItemFresh,
		loaderStateRef,
	});

	return (
		<Provider updateLocation={updateLocation} invalidate={invalidate} prefetchLoader={prefetchLoader}>
			{children}
		</Provider>
	);
};
