import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearch } from './useSearch';
import { router } from '../instance';

type UseSearchParamsReturn = {
	searchParams: URLSearchParams;
	getSearchParams(arg: string): string | string[];
	setSearchParams: {
		(param: string, value: string | string[]): void;
		(param: (prevState: URLSearchParams) => URLSearchParams): void;
	};
};

const useLatest = <T>(value: T) => {
	const ref = useRef(value);
	useEffect(() => {
		ref.current = value;
	}, [value]);
	return ref;
};

export const useSearchParams = (): UseSearchParamsReturn => {
	const search = useSearch();

	const searchString = search ? search.replace('?', '') : window.location.search;

	const searchStringRef = useLatest(searchString);

	const searchParams = useMemo(() => new URLSearchParams(searchString), [searchString]);

	const getSearchParams = useCallback(
		(param: string) => {
			const allValues = searchParams.getAll(param);
			return allValues.length > 1 ? allValues : (allValues[0] ?? '');
		},
		[searchParams]
	);

	const navigateWithSearchParams = useCallback((params: URLSearchParams) => {
		const newSearch = params.toString();
		const { pathname } = window.location;
		const search = newSearch ? `?${newSearch}` : '';
		history.replaceState(null, '', pathname + search);
		router.runtime.syncSearch(search);
	}, []);

	const setSearchParams = useCallback(
		(param: string | ((prevState: URLSearchParams) => URLSearchParams), value?: string | string[]) => {
			const currentParams = new URLSearchParams(searchStringRef.current);

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
		[navigateWithSearchParams, searchStringRef]
	);

	return { searchParams, getSearchParams, setSearchParams };
};
