import { useEffect } from 'react';
import { routerConfig } from '../config/routerConfig';

export const useSetIsAnimated = (isAnimated = false, showFallbackIfAnimated: boolean) => {
	useEffect(() => routerConfig.configure({ isAnimated, showFallbackIfAnimated }), [isAnimated]);
};
