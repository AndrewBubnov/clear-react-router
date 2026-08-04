import { router } from '../instance';

export const useIsRoutePending = (routePath: string) => {
	const { useIsLoading } = router.hooks;
	const [isPending] = useIsLoading();
	const pendingState = router.state.pendingState.value;

	return isPending && pendingState?.location.pathname === routePath;
};
