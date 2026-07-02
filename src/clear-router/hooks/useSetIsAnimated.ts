import { isAnimatedStore } from '../store/isAnimatedStore';
import { useEffect } from 'react';

export const useSetIsAnimated = (isAnimated?: boolean) => {
	const setIsAnimated = isAnimatedStore.use(state => state.setIsAnimated);

	useEffect(() => setIsAnimated(!!isAnimated), [isAnimated]);
};
