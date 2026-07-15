import { useEffect } from 'react';
import { routerConfig } from '../config/routerConfig';
import { RouterProps } from '../types/global';

export const useSetRouterConfig = (routerProps: Omit<RouterProps, 'routes'>) => {
	useEffect(() => routerConfig.configure(routerProps), [routerProps]);
};
