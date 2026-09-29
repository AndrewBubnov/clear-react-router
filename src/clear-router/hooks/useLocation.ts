import { router } from '../instance';

export const useLocation = () => router.hooks.useRouteItemDataSelector(state => state.location);
