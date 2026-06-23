import { ReactNode, useMemo, useState } from 'react';
import { Provider } from '../provider/Provider';
import { useHandleNavigation } from '../hooks/useHandleNavigation';
import { useLoader } from '../hooks/useLoader';
import { usePreserveScroll } from '../hooks/usePreserveScroll';
import { useApplyCustomAnimation } from '../hooks/useApplyCustomAnimation';
import { Location, RouteItem } from '../types/global';

type RouteProviderProps = {
	children: ReactNode;
	routeList: RouteItem[];
	context?: Record<string, unknown>;
	isAnimated?: boolean;
	animationDuration?: number;
	preserveScroll?: boolean;
};

export const RouterProvider = ({
	children,
	routeList,
	context: initialContext = {},
	isAnimated = false,
	animationDuration,
	preserveScroll = true,
}: RouteProviderProps) => {
	const [location, setLocation] = useState<Location>({} as Location);
	const [context, setContext] = useState<Record<string, unknown>>(initialContext);

	useApplyCustomAnimation(animationDuration);

	const setScrollMap = usePreserveScroll({ pathname: location.pathname, preserveScroll });

	const { loaderError, loaderCache, prefetchLoader, revalidateCache, isLoading } = useLoader({
		routeList,
		context,
		setContext,
	});

	const { blockerState, updateLocation, updateBlockedRoute, beforeLoadError } = useHandleNavigation({
		setLocation,
		routeList,
		context,
		setContext,
		revalidateCache,
		isAnimated,
		setScrollMap,
	});

	const providerProps = useMemo(
		() => ({
			location,
			setLocation,
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
