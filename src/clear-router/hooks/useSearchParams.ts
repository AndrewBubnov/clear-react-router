import { useCallback, useEffect, useMemo, useRef } from 'react';
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
	const { useRouteDataSelector, useNavigate } = router.hooks;
	const location = useRouteDataSelector(state => state.location);
	const { search = window.location.search } = location;
	const navigate = useNavigate();

	const searchRef = useLatest(search);

	const searchParams = useMemo(() => new URLSearchParams(search), [search]);

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
			const search = newSearch ? `?${newSearch}` : '';
			// Identical parameters are a no-op: the navigation would only push a
			// duplicate history entry.
			if (search === (location.search ?? '')) return;
			navigate({ ...location, search });
		},
		[location, navigate]
	);

	const setSearchParams = useCallback(
		(param: string | ((prevState: URLSearchParams) => URLSearchParams), value?: string | string[]) => {
			const currentParams = new URLSearchParams(searchRef.current);

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
		[navigateWithSearchParams, searchRef]
	);

	return { searchParams, getSearchParams, setSearchParams };
};
