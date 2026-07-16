import { navigation, prevPathname } from './navigation';
import { routerConfig } from '../config/routerConfig';
import { Location, RouteItem } from '../types/global';

export const transitionedNavigation = (nextLocation: Location, routeItem: RouteItem | undefined) => {
	const { isAnimated } = routerConfig;
	if (!isAnimated || !prevPathname.current) {
		navigation(nextLocation, routeItem);
		return;
	}
	try {
		document.startViewTransition(() => navigation(nextLocation, routeItem));
	} catch {
		navigation(nextLocation, routeItem);
	}
};
