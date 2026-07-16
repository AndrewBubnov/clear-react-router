import { STANDARD_PREFETCH_DELAY } from '../constants';
import { RouterProps } from '../types/global';

class RouterConfig {
	prefetch: RouterProps['prefetch'] = 'hover';
	hoverPrefetchDelay = STANDARD_PREFETCH_DELAY;
	configure(config: Partial<RouterConfig>) {
		Object.assign(this, config);
	}
}

export const routerConfig = new RouterConfig();
