import { useCallback, useMemo } from 'react';
import { useLatest } from './useLatest.ts';
import { useNavigationState, useRouterActions } from './useServiceContext.ts';

type UseSearchParamsReturn = {
	searchParams: URLSearchParams;
	getSearchParams(arg: string): string | string[];
	setSearchParams: {
		(param: string, value: string | string[]): void;
		(param: (prevState: URLSearchParams) => URLSearchParams): void;
	};
};

export const useSearchParams = (): UseSearchParamsReturn => {
	const {
		routeItemData: { location },
	} = useNavigationState();
	const { setSearch } = useRouterActions();

	const locationRef = useLatest(location);

	const searchString = useMemo(
		() => (location.search ? location.search.replace('?', '') : (location.pathname.split('?')?.[1] ?? '')),
		[location.pathname, location.search]
	);

	const searchParams = useMemo(() => new URLSearchParams(searchString), [searchString]);

	const getSearchParams = useCallback(
		(param: string) => {
			const allValues = searchParams.getAll(param);
			return allValues.length > 1 ? allValues : (allValues[0] ?? '');
		},
		[searchParams]
	);

	const navigateWithSearchParams = useCallback(
		(params: URLSearchParams) => {
			const newSearch = params.toString();
			const { pathname } = locationRef.current;
			const search = newSearch ? `?${newSearch}` : '';
			setSearch(search);
			history.replaceState(null, '', pathname + search);
		},
		[locationRef, setSearch]
	);

	const setSearchParams = useCallback(
		(param: string | ((prevState: URLSearchParams) => URLSearchParams), value?: string | string[]) => {
			const search = locationRef.current.search || '';
			const currentParams = new URLSearchParams(search);

			if (typeof param === 'string' && value !== undefined) {
				currentParams.delete(param);
				const values = Array.isArray(value) ? value : [value];
				values.forEach(v => currentParams.append(param, v));
				navigateWithSearchParams(currentParams);
			} else if (typeof param === 'function') {
				const newParams = param(currentParams);
				navigateWithSearchParams(newParams);
			} else {
				throw new Error('useSearchParams first argument must be either function or string');
			}
		},
		[locationRef, navigateWithSearchParams]
	);

	return { searchParams, getSearchParams, setSearchParams };
};
