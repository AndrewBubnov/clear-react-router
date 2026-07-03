import { useEffect } from 'react';
import { routerConfig } from '../config/routerConfig.ts';

export const useSetIsAnimated = (isAnimated = false, showFallbackIfAnimated: boolean) => {
	useEffect(() => routerConfig.configure({ isAnimated, showFallbackIfAnimated }), [isAnimated]);
};
