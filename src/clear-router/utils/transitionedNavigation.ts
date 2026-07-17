import { navigationExecutor } from './navigationExecutor';
import { routerConfig } from '../config/routerConfig';
import { prevPathnameRef } from '../cell';
import { Location, RouteItem } from '../types/global';

export const transitionedNavigation = (nextLocation: Location, routeItem: RouteItem | undefined) => {
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
