import { useEffect, useRef } from 'react';
import { useSearch } from './useSearch';
import { useInvalidate } from './useInvalidate';
import { useLocation } from './useLocation';

export const useSearchValue = () => {
	const invalidate = useInvalidate();
	const search = useSearch();
	const { pathname } = useLocation();
	const isMounted = useRef(false);
	useEffect(() => {
		if (!pathname) return;
		if (!isMounted.current) {
			isMounted.current = true;
			return;
		}
		invalidate(pathname);
	}, [invalidate, search, pathname]);
};
