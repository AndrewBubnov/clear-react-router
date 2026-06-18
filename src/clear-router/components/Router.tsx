import { useMemo, useState } from 'react';
import { RouterProvider } from '../provider/RouterProvider.tsx';
import { useHandleNavigation } from '../hooks/useHandleNavigation.ts';
import { useLoader } from '../hooks/useLoader.ts';
import { useApplyCustomAnimation } from '../hooks/useApplyCustomAnimation.ts';
import { Spinner } from './Spinner.tsx';
import { renderElement } from '../utils/renderElement.tsx';
import { comparePaths, getParamsObject } from '../utils/utils.ts';
import { AnimationOptions, Location, RouteItem } from '../types/global.ts';

type RouterProps = {
	routeList: RouteItem[];
	context?: Record<string, unknown>;
	isAnimated?: boolean;
	animationOptions?: AnimationOptions;
};

const PAGE_NOT_FOUND = 'error 404. Page not found';
const ALL_LOCATIONS = '*';

export const Router = ({
	routeList,
	context: initialContext = {},
	isAnimated = false,
	animationOptions = {},
}: RouterProps) => {
	const [location, setLocation] = useState<Location>({} as Location);
	const [context, setContext] = useState<Record<string, unknown>>(initialContext);

	useApplyCustomAnimation(animationOptions);

	const routeItem = useMemo(() => {
		if (!location.pathname) return undefined;
		return routeList.find(el => el.path === ALL_LOCATIONS || comparePaths(el, location.pathname));
	}, [location.pathname, routeList]);

	const params: Record<string, string> = useMemo(
		() => getParamsObject({ routeItem, pathname: window.location.pathname }),
		[routeItem]
	);

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
			params,
			loaderCache,
			prefetchLoader,
			updateBlockedRoute,
			blockerState,
			context,
			setContext,
		}),
		[blockerState, loaderCache, location, params, prefetchLoader, context, updateBlockedRoute, updateLocation]
	);

	if (!routeItem) return null;

	if (!isAnimated && routeItem?.loader && !loaderError && isLoading)
		return <RouterProvider {...providerProps}>{renderElement(routeItem?.loaderFallback)}</RouterProvider>;

	if (loaderError || beforeLoadError) {
		return (
			<RouterProvider {...providerProps}>
				{renderElement(routeItem?.errorElement)}
				{isAnimated && isLoading && <Spinner />}
			</RouterProvider>
		);
	}

	return (
		<RouterProvider {...providerProps}>
			{renderElement(routeItem?.element) || PAGE_NOT_FOUND}
			{isAnimated && isLoading && <Spinner />}
		</RouterProvider>
	);
};
