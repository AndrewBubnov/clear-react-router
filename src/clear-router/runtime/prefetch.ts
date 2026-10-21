import { findRoute } from '../utils/findRoute';
import { isMobile } from '../utils/utils';
import { RevalidateCache, RouterState, Location } from '../types';

const MOBILE_PREFETCH_CONCURRENCY = 2;
const DESKTOP_PREFETCH_CONCURRENCY = 4;

export const createPrefetch = ({ routeDataState }: RouterState, revalidateCache: RevalidateCache) => {
	const maxConcurrent = isMobile() ? MOBILE_PREFETCH_CONCURRENCY : DESKTOP_PREFETCH_CONCURRENCY;
	const queue: (() => Promise<void>)[] = [];
	let active = 0;

	const run = async (location: Location) => {
		const item = findRoute(location.pathname);
		if (!item) return;
		const currentLocation = routeDataState.getState().location;
		if (location.pathname === currentLocation.pathname && location.search === currentLocation.search) return;
		await item.preloadElement?.();
		await revalidateCache({ routeItem: item, location });
	};

	const drain = () => {
		while (active < maxConcurrent && queue.length) {
			active++;
			queue.shift()!();
		}
	};

	return (location: Location, signal?: AbortSignal) =>
		new Promise<void>(resolve => {
			queue.push(async () => {
				try {
					if (!signal?.aborted) await run(location);
				} catch {
					// prefetch — best effort
				} finally {
					active--;
					resolve();
					drain();
				}
			});
			drain();
		});
};
