import { useEffect } from 'react';
import { isAnimatedStore } from '../store/isAnimatedStore';

export const useSetIsAnimated = (isAnimated?: boolean) => {
	const setIsAnimated = isAnimatedStore.use(state => state.setIsAnimated);

	useEffect(() => setIsAnimated(!!isAnimated), [isAnimated]);
};
