import { router } from '../instance';
import type { Status } from '../types';

export function useRouteStatus(): Status;
export function useRouteStatus(predicate: (status: Status) => boolean): boolean;
export function useRouteStatus(predicate?: (status: Status) => boolean) {
	const { useRouteDataSelector } = router.hooks;
	return useRouteDataSelector(({ status }) => (predicate ? predicate(status) : status));
}
