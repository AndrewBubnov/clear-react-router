import { routerConfig } from '../config/routerConfig';

export const commitNavigation = (callback: () => void) => {
	if (!routerConfig.isAnimated) return callback();
	try {
		document.startViewTransition(callback);
	} catch {
		callback();
	}
};
