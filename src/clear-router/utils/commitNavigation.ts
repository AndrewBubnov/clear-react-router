import { commitState } from './commitState.ts';
import { routerConfig } from '../config/routerConfig';
import { prevPathnameRef } from '../cell';
import { Location, RouteItem } from '../types/global';

export const commitNavigation = (nextLocation: Location, routeItem: RouteItem | undefined) => {
	const { isAnimated } = routerConfig;
	if (!isAnimated || !prevPathnameRef.value) {
		commitState(nextLocation, routeItem);
		return;
	}
	try {
		document.startViewTransition(() => commitState(nextLocation, routeItem));
	} catch {
		commitState(nextLocation, routeItem);
	}
};
