import { router } from '../instance';

export const useIsDataLoading = () => {
	const { usePendingState } = router.hooks;
	const [pendingState] = usePendingState();
	return Boolean(pendingState);
};
