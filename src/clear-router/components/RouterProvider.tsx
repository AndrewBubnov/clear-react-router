import { ReactNode, useEffect } from 'react';
import { useCallbackState } from '../state/state';
import { useNavigation } from '../hooks/useNavigation';
import { useLoader } from '../hooks/useLoader';
import { RouteItem } from '../types/global';

type RouteProviderProps = {
	children: ReactNode;
	routes: RouteItem[];
};

export const RouterProvider = ({ children, routes }: RouteProviderProps) => {
	const [, setCallbackState] = useCallbackState();
	const { prefetchLoader, revalidateCache, isCacheItemFresh, loaderStateRef, invalidate } = useLoader(routes);

	const updateLocation = useNavigation({
		routes,
		revalidateCache,
		isCacheItemFresh,
		loaderStateRef,
	});

	useEffect(() => {
		setCallbackState({
			updateLocation,
			prefetchLoader,
			invalidate,
		});
	}, [invalidate, prefetchLoader, setCallbackState, updateLocation]);

	return children;
};
