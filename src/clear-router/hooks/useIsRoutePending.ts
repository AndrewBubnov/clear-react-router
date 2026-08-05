import { router } from '../instance';

export const useIsRoutePending = (routePath: string) => {
	const { usePendingState } = router.hooks;
	const [pendingState] = usePendingState();
	return pendingState?.location.pathname === routePath;
};
