import { router } from '../instance';
import type { Status } from '../types';

export const useRouteStatus = (predicate?: (status: Status) => boolean) => {
	const { useRouteItemDataSelector } = router.hooks;
	const status = useRouteItemDataSelector(({ status }) => status);
	return predicate ? predicate(status) : status;
};
