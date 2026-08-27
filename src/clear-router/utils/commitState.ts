import { Location, RouteItem, RouterState } from '../types';

export const createCommitState =
	({ routeItemDataState, pendingState, isOptimisticLoading }: RouterState) =>
	(nextLocation: Location, routeItem: RouteItem | undefined) => {
		routeItemDataState.setState({ routeItem, location: nextLocation });
		pendingState.setState(undefined);
		isOptimisticLoading.setState(false);
		const fullPath = nextLocation.search ? `${nextLocation.pathname}${nextLocation.search}` : nextLocation.pathname;
		if (fullPath === window.location.pathname + window.location.search) return;
		history.pushState(null, '', `${nextLocation.pathname}${nextLocation.search}`);
	};
