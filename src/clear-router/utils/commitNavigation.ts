import { routerConfig } from '../config/routerConfig';
import { Store } from '../create';
import { Location, RouteItem, RouteItemData } from '../types';

export const createCommitNavigation =
	(
		navigationExecutor: (arg: Location, routeItem: RouteItem | undefined) => void,
		routeItemDataState: Store<RouteItemData>
	) =>
	(nextLocation: Location, routeItem: RouteItem | undefined) => {
		const { isAnimated } = routerConfig;
		if (!isAnimated || !routeItemDataState.getState().location.pathname) {
			navigationExecutor(nextLocation, routeItem);
			return;
		}
		try {
			document.startViewTransition(() => navigationExecutor(nextLocation, routeItem));
		} catch {
			navigationExecutor(nextLocation, routeItem);
		}
	};
