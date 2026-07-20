import { useGlobalState } from './createState';
import { RouterType } from '../types/global';

export const useIsLoading = (router: RouterType) => useGlobalState(router.state.isLoadingState);

export const useBlockedRoute = (router: RouterType) => useGlobalState(router.state.blockedRouteState);

export const useLoaderFallback = (router: RouterType) => useGlobalState(router.state.loaderFallbackState);

export const useRouteItemData = (router: RouterType) => useGlobalState(router.state.routeItemDataState);

export const useCurrentLoaderState = (router: RouterType) => useGlobalState(router.state.currentLoaderState);

export const useScrollMap = (router: RouterType) => useGlobalState(router.state.scrollMapState);

export const useContextState = (router: RouterType) => useGlobalState(router.state.contextState);
