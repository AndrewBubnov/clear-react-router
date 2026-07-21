import { routerConfig } from '../config/routerConfig';
import { Cell } from '../cell';
import { Location, RouteItem } from '../types/global';

export const createCommitNavigation =
	(navigationExecutor: (arg: Location, routeItem: RouteItem | undefined) => void, prevPathnameRef: Cell<string>) =>
	(nextLocation: Location, routeItem: RouteItem | undefined) => {
		const { isAnimated } = routerConfig;
		if (!isAnimated || !prevPathnameRef.value) {
			navigationExecutor(nextLocation, routeItem);
			return;
		}
		try {
			document.startViewTransition(() => navigationExecutor(nextLocation, routeItem));
		} catch {
			navigationExecutor(nextLocation, routeItem);
		}
	};
