import { Location, RouteItem, RouterState } from '../types';

export const createCommitState =
	({ loaderStateRef, loaderState, routeItemDataState }: RouterState) =>
	(nextLocation: Location, routeItem?: RouteItem) => {
		const isError = loaderStateRef.value.loaderError || loaderStateRef.value.beforeLoadError;
		routeItemDataState.setState({ routeItem, location: nextLocation, status: isError ? 'error' : 'active' });
		loaderState.setState(loaderStateRef.value);
		const fullPath = nextLocation.search ? `${nextLocation.pathname}${nextLocation.search}` : nextLocation.pathname;
		if (fullPath === window.location.pathname + window.location.search) return;
		history.pushState(null, '', `${nextLocation.pathname}${nextLocation.search}`);
	};
