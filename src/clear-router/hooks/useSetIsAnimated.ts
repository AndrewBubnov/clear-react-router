import { useEffect } from 'react';
import { routerConfig } from '../config/routerConfig';
import { RouterProps } from '../types/global';

export const useSetIsAnimated = (routerProps: RouterProps) => {
	useEffect(() => routerConfig.configure(routerProps), [routerProps]);
};
