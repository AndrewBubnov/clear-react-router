import { ReactNode, useMemo, useState } from 'react';
import { Provider } from '../provider/Provider';
import { useHandleNavigation } from '../hooks/useHandleNavigation';
import { useLoader } from '../hooks/useLoader';
import { useApplyCustomAnimation } from '../hooks/useApplyCustomAnimation';
import { Location, RouteItem } from '../types/global';

type RouteProviderProps = {
	children: ReactNode;
	routeList: RouteItem[];
	context?: Record<string, unknown>;
	isAnimated?: boolean;
	animationDuration?: number;
};

export const RouterProvider = ({
	children,
	routeList,
	context: initialContext = {},
	isAnimated = false,
	animationDuration,
}: RouteProviderProps) => {
	const [location, setLocation] = useState<Location>({} as Location);
	const [context, setContext] = useState<Record<string, unknown>>(initialContext);

	useApplyCustomAnimation(animationDuration);

	const { loaderError, loaderCache, prefetchLoader, revalidateCache, isLoading } = useLoader({ routeList, context });

	const { blockerState, updateLocation, updateBlockedRoute, beforeLoadError } = useHandleNavigation({
		setLocation,
		routeList,
		context,
		revalidateCache,
		isAnimated,
	});

	const providerProps = useMemo(
		() => ({
			location,
			updateLocation,
			loaderCache,
			prefetchLoader,
			updateBlockedRoute,
			blockerState,
			context,
			setContext,
			routeList,
			isLoading,
			shouldErrorElementShown: loaderError || beforeLoadError,
			isAnimated,
		}),
		[
			beforeLoadError,
			blockerState,
			context,
			isLoading,
			loaderCache,
			loaderError,
			location,
			prefetchLoader,
			routeList,
			updateBlockedRoute,
			updateLocation,
			isAnimated,
		]
	);

	return <Provider {...providerProps}>{children}</Provider>;
};
