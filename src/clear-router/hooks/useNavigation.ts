import { useEffect } from 'react';
import { navigationHandler } from '../runtime/navigationHandler';
import { useBlockedRoute } from '../state/state';
import { parseWindowLocation } from '../utils/utils';
import { prevPathname } from '../utils/navigation';

export const useNavigation = () => {
	const [blockedRoute, setBlockedRoute] = useBlockedRoute();

	useEffect(() => {
		const handler = async (event: PopStateEvent) => {
			const newLocation = parseWindowLocation((event.target as Window).location);
			if (prevPathname.current === blockedRoute.from) {
				setBlockedRoute({ from: prevPathname.current, to: newLocation.pathname });
				history.pushState(null, '', prevPathname.current);
			} else {
				navigationHandler(newLocation);
			}
		};
		window.addEventListener('popstate', handler);
		return () => window.removeEventListener('popstate', handler);
	}, [blockedRoute.from, setBlockedRoute]);

	useEffect(() => {
		const currentLocation = parseWindowLocation(window.location);
		navigationHandler(currentLocation);
		prevPathname.current = currentLocation.pathname;
	}, []);
};
