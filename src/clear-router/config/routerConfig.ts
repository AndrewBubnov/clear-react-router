import { STANDARD_PREFETCH_DELAY } from '../constants';
import { ClientRouteItem, RouterProps } from '../types';

class RouterConfig {
	routes: RouterProps['routes'] = [];
	maxCacheSize: number = 0;
	defaultPrefetch: RouterProps['defaultPrefetch'] = 'hover';
	isAnimated: RouterProps['isAnimated'] = false;
	defaultHoverPrefetchDelay = STANDARD_PREFETCH_DELAY;
	defaultBeforeLoad?: ClientRouteItem['beforeLoad'];
	defaultAfterLoad?: ClientRouteItem['afterLoad'];
	defaultRetry?: RouterProps['defaultRetry'];
	defaultStaleTime?: RouterProps['defaultStaleTime'];
	defaultPreserveScroll?: RouterProps['defaultPreserveScroll'];
	defaultMinLoaderDuration?: RouterProps['defaultMinLoaderDuration'];
	configure(config: Partial<RouterConfig>) {
		Object.assign(this, config);
	}
}

export const routerConfig = new RouterConfig();
