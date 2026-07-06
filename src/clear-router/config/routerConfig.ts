import { STANDARD_PREFETCH_DELAY } from '../constants';
import { RouterProps } from '../types/global.ts';

class RouterConfig {
	isAnimated = false;
	showFallbackIfAnimated = false;
	prefetch: RouterProps['prefetch'] = 'hover';
	prefetchDelay = STANDARD_PREFETCH_DELAY;
	configure(config: Partial<RouterConfig>) {
		Object.assign(this, config);
	}
}

export const routerConfig = new RouterConfig();
