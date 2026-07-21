import { STANDARD_PREFETCH_DELAY } from '../constants';
import { ClientRouteItem, RouterProps } from '../types';

class RouterConfig {
	routes: RouterProps['routes'] = [];
	prefetch: RouterProps['prefetch'] = 'hover';
	isAnimated: RouterProps['isAnimated'] = false;
	showFallbackOnAnimation: RouterProps['showFallbackOnAnimation'] = false;
	hoverPrefetchDelay = STANDARD_PREFETCH_DELAY;
	beforeLoad?: ClientRouteItem['beforeLoad'];
	afterLoad?: ClientRouteItem['afterLoad'];
	configure(config: Partial<RouterConfig>) {
		Object.assign(this, config);
	}
}

export const routerConfig = new RouterConfig();
