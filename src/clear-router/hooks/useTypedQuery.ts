import { useCallback, useMemo } from 'react';
import { useSearchParams } from './useSearchParams.ts';

export function useTypedQuery<T>(field: string, parser: (arg: string[]) => T, defaultValue?: T): [T, (arg: T) => void] {
	const { searchParams, setSearchParams } = useSearchParams();

	const value = useMemo(() => {
		const params = searchParams.getAll(field);
		const result = parser(params);
		if (result !== undefined && result !== null && result !== '') return result;
		if (defaultValue !== undefined) return defaultValue;
		return result;
	}, [field, parser, searchParams, defaultValue]);

	const setValue = useCallback((value: T) => setSearchParams(field, JSON.stringify(value)), [setSearchParams, field]);

	return [value, setValue];
}
