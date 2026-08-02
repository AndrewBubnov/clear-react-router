import { useLayoutEffect } from 'react';
import { routerConfig } from '../config/routerConfig';
import { RouterProps } from '../types';

export const useSetRouterConfig = (routerProps: RouterProps) => {
	useLayoutEffect(() => routerConfig.configure(routerProps), [routerProps]);
};
