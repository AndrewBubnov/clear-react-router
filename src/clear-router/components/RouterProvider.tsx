import { ReactNode, useMemo, useState } from 'react';
import { Provider } from '../provider/Provider.tsx';
import { useHandleNavigation } from '../hooks/useHandleNavigation.ts';
import { useLoader } from '../hooks/useLoader.ts';
import { useApplyCustomAnimation } from '../hooks/useApplyCustomAnimation.ts';
import { AnimationOptions, Location, RouteItem } from '../types/global.ts';

type RouteProviderProps = {
	children: ReactNode;
	routeList: RouteItem[];
	context?: Record<string, unknown>;
	isAnimated?: boolean;
	animationOptions?: AnimationOptions;
};

export const RouterProvider = ({
	children,
	routeList,
	context: initialContext = {},
	isAnimated = false,
	animationOptions = {},
}: RouteProviderProps) => {
	const [location, setLocation] = useState<Location>({} as Location);
	const [context, setContext] = useState<Record<string, unknown>>(initialContext);

	useApplyCustomAnimation(animationOptions);

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
