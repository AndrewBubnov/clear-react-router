import { useRouter } from './useRouter';

export const useLocation = () => {
	const router = useRouter();
	const [routeItemData] = router.hooks.useRouteItemData();

	return routeItemData.location;
};
