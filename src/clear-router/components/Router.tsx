import { useMemo, useState } from 'react';
import { RouterProvider } from '../provider/RouterProvider';
import { useHandleNavigation } from '../hooks/useHandleNavigation';
import { useLoader } from '../hooks/useLoader';
import { useApplyCustomAnimation } from '../hooks/useApplyCustomAnimation';
import { Spinner } from './Spinner/Spinner';
import { renderElement } from '../utils/renderElement';
import { comparePaths, getParamsObject, parseWindowLocation } from '../utils/utils';
import { AnimationOptions, Location, RouteItem } from '../types/global';

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
	const [location, setLocation] = useState<Location>(parseWindowLocation(window.location));
	const [context, setContext] = useState<Record<string, unknown>>(initialContext);

	useApplyCustomAnimation(animationOptions);

	const routeItem = useMemo(
		() => routeList.find(el => el.path === ALL_LOCATIONS || comparePaths(el, location.pathname)),
		[location.pathname, routeList]
	);

	const { loaderError, loaderCache, prefetchLoader, revalidateCache, isLoading } = useLoader(routeList);

	const { blockerState, updateLocation, updateBlockedRoute } = useHandleNavigation({
		setLocation,
		routeList,
		context,
		revalidateCache,
		isAnimated,
	});

	const params = useMemo(() => (routeItem?.params ? getParamsObject(routeItem.params) : {}), [routeItem]);

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

	if (!isAnimated && routeItem?.loader && !loaderError && isLoading)
		return <RouterProvider {...providerProps}>{renderElement(routeItem?.loaderFallback)}</RouterProvider>;

	if (loaderError)
		return <RouterProvider {...providerProps}>{renderElement(routeItem?.errorElement)}</RouterProvider>;

	return (
		<RouterProvider {...providerProps}>
			{renderElement(routeItem?.element) || PAGE_NOT_FOUND}
			{isAnimated && isLoading && <Spinner />}
		</RouterProvider>
	);
};
