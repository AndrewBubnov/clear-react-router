import { LoaderState, Location, RouterState } from '../types';

type CommitState = {
	location: Location;
	loaderStateValue: LoaderState;
};

export const createCommitState =
	({ loaderState, routeItemDataState, blockerState }: RouterState) =>
	({ loaderStateValue, location }: CommitState) => {
		const isError = loaderStateValue.loaderError || loaderStateValue.beforeLoadError;
		routeItemDataState.setState(prevState => {
			if (prevState.status === 'active') return prevState;
			return { ...prevState, location, status: isError ? 'error' : 'active' };
		});
		loaderState.setState(loaderStateValue);
		if (blockerState.getState() === 'blocked') blockerState.setState('unblocked');
		const fullPath = location.search ? `${location.pathname}${location.search}` : location.pathname;
		if (fullPath === window.location.pathname + window.location.search) return;
		history.pushState(location.state ?? null, '', `${location.pathname}${location.search}`);
	};
