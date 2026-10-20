import { router } from '../instance';

export const useLocation = () => router.hooks.useRouteDataSelector(state => state.location);
