import { loaderStateRef } from './revalidateCache';
import { currentLoaderState, isLoadingState, loaderFallbackState, routeItemDataState } from '../state/state';
import { Location, RouteItem } from '../types/global';

export const prevPathname: Record<'current', string> = { current: '' };

export const navigation = (nextLocation: Location, routeItem: RouteItem | undefined) => {
	routeItemDataState.setState({ routeItem, location: nextLocation });
	currentLoaderState.setState(loaderStateRef.current);
	isLoadingState.setState(false);
	loaderFallbackState.setState(undefined);
	prevPathname.current = nextLocation.pathname;
	const fullPath = nextLocation.search ? `${nextLocation.pathname}${nextLocation.search}` : nextLocation.pathname;
	if (fullPath === window.location.pathname + window.location.search) return;
	history.pushState(null, '', fullPath);
};
