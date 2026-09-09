import { LoaderState, Location, RouteItem, RouterState } from '../types';

type CommitState = {
	location: Location;
	loaderStateValue: LoaderState;
	routeItem?: RouteItem;
};

export const createCommitState =
	({ loaderState, routeItemDataState }: RouterState) =>
	({ routeItem, loaderStateValue, location }: CommitState) => {
		const isError = loaderStateValue.loaderError || loaderStateValue.beforeLoadError;
		routeItemDataState.setState({ routeItem, location, status: isError ? 'error' : 'active' });
		loaderState.setState(loaderStateValue);
		const fullPath = location.search ? `${location.pathname}${location.search}` : location.pathname;
		if (fullPath === window.location.pathname + window.location.search) return;
		history.pushState(null, '', `${location.pathname}${location.search}`);
	};
