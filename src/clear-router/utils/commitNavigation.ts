import { routerConfig } from '../config/routerConfig';
import { Store } from '../create';
import { Location, RouteItem, RouteItemData } from '../types';

export const createCommitNavigation =
	(
		navigationExecutor: (arg: Location, routeItem: RouteItem | undefined) => void,
		routeItemDataState: Store<RouteItemData>
	) =>
	(nextLocation: Location, routeItem: RouteItem | undefined) => {
		const isFirstLoad = !routeItemDataState.getState().location.pathname;
		if (!routerConfig.isAnimated || isFirstLoad) return navigationExecutor(nextLocation, routeItem);
		try {
			document.startViewTransition(() => navigationExecutor(nextLocation, routeItem));
		} catch {
			navigationExecutor(nextLocation, routeItem);
		}
	};
