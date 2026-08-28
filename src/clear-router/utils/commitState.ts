import { Location, RouteItem, RouterState } from '../types';

export const createCommitState =
	({ routeItemDataState, statusState, isOptimisticLoading, loaderStateRef, loaderState }: RouterState) =>
	(nextLocation: Location, routeItem: RouteItem | undefined) => {
		routeItemDataState.setState({ routeItem, location: nextLocation });
		statusState.setState('active');
		isOptimisticLoading.setState(false);
		loaderState.setState(loaderStateRef.value);
		const fullPath = nextLocation.search ? `${nextLocation.pathname}${nextLocation.search}` : nextLocation.pathname;
		if (fullPath === window.location.pathname + window.location.search) return;
		history.pushState(null, '', fullPath);
	};
