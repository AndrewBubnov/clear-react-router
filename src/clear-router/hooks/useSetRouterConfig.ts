import { useEffect } from 'react';
import { routerConfig } from '../config/routerConfig';
import { RouterProps } from '../types';

export const useSetRouterConfig = (routerProps: RouterProps) => {
	useEffect(() => routerConfig.configure(routerProps), [routerProps]);
};
