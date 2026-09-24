import { router } from '../instance';

export const useIsRoutePending = (routePath: string) => {
	const { useRouteItemDataSelector } = router.hooks;
	return useRouteItemDataSelector(
		({ location: { pathname }, status }) => pathname === routePath && status === 'pending'
	);
};
