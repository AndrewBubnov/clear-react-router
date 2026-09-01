import { routerConfig } from '../config/routerConfig';

export const commitNavigation = (callback: () => void, isCommited?: boolean) => {
	if (!routerConfig.isAnimated || isCommited) return callback();
	try {
		const transition = document.startViewTransition(callback);
		transition.ready.catch(() => {});
		transition.finished.catch(() => {});
	} catch {
		callback();
	}
};
