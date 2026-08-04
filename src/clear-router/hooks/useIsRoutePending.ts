import { router } from '../instance';

export const useIsRoutePending = (routePath: string) => {
	const { useIsLoading, usePendingState } = router.hooks;
	const [isPending] = useIsLoading();
	const [pendingState] = usePendingState();

	return isPending && pendingState?.location.pathname === routePath;
};
