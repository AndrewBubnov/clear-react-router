import { useEffect } from 'react';
import { routerConfig } from '../config/routerConfig';
import { RouterProps } from '../types/global';

export const useSetRouterConfig = (
	routerProps: Omit<RouterProps, 'router'> & { routes: RouterProps['router']['routes'] }
) => {
	useEffect(() => routerConfig.configure(routerProps), [routerProps]);
};
