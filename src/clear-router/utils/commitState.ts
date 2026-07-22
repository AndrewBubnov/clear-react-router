import { Location, RouteItem, RouterState } from '../types';

export const createCommitState =
	({
		isLoadingState,
		routeItemDataState,
		loaderFallbackState,
		currentLoaderState,
		prevPathnameRef,
		loaderStateRef,
	}: RouterState) =>
	(nextLocation: Location, routeItem: RouteItem | undefined) => {
		routeItemDataState.setState({ routeItem, location: nextLocation });
		currentLoaderState.setState(loaderStateRef.value);
		isLoadingState.setState(false);
		loaderFallbackState.setState(undefined);
		prevPathnameRef.set(nextLocation.pathname);
		const fullPath = nextLocation.search ? `${nextLocation.pathname}${nextLocation.search}` : nextLocation.pathname;
		if (fullPath === window.location.pathname + window.location.search) return;
		history.pushState(null, '', fullPath);
	};
