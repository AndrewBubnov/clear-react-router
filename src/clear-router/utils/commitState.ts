import { LoaderState, Location, RouteItem, RouterState } from '../types';

type CommitState = {
	nextLocation: Location;
	routeItem?: RouteItem;
	loaderStateValue: LoaderState;
};

export const createCommitState =
	({ loaderState, routeItemDataState }: RouterState) =>
	({ routeItem, loaderStateValue, nextLocation }: CommitState) => {
		const isError = loaderStateValue.loaderError || loaderStateValue.beforeLoadError;
		routeItemDataState.setState({ routeItem, location: nextLocation, status: isError ? 'error' : 'active' });
		loaderState.setState(loaderStateValue);
		const fullPath = nextLocation.search ? `${nextLocation.pathname}${nextLocation.search}` : nextLocation.pathname;
		if (fullPath === window.location.pathname + window.location.search) return;
		history.pushState(null, '', `${nextLocation.pathname}${nextLocation.search}`);
	};
