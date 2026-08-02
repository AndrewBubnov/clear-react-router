import { useEffect, useRef } from 'react';
import { useInvalidate } from './useInvalidate';
import { useLocation } from './useLocation';

export const useSearchValue = (enabled?: boolean) => {
	const invalidate = useInvalidate();
	const { search, pathname } = useLocation();
	const isMounted = useRef(false);

	useEffect(() => {
		if (!enabled || !pathname) return;
		if (!isMounted.current) {
			isMounted.current = true;
			return;
		}
		invalidate(pathname);
	}, [invalidate, search, pathname, enabled]);
};
