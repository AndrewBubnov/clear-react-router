import { router } from '../instance';
import { routerConfig } from '../config/routerConfig';
import { ScrollRestorationBehavior } from '../types';

export const useRestoreScroll = (behavior?: ScrollRestorationBehavior) => {
	const { useScrollRestoration } = router.hooks;
	const { defaultScrollRestorationBehavior = 'auto' } = routerConfig;
	return useScrollRestoration(behavior ?? defaultScrollRestorationBehavior);
};
