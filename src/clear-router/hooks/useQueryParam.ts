import { useCallback, useMemo } from 'react';
import { useSearchParams } from './useSearchParams';
import { AdapterType } from '../types/global';

export function useQueryParam<T>(
	field: string,
	adapter: AdapterType<T>,
	defaultValue?: T
): [T, (arg: T | null) => void] {
	const { searchParams, setSearchParams } = useSearchParams();

	const value = useMemo(() => {
		const params = searchParams.getAll(field);
		const result = adapter.parse(params);
		const isValid = !(result instanceof Date) || (result instanceof Date && !isNaN(result.getTime()));
		if (result !== undefined && result !== null && result !== '' && isValid) return result;
		if (defaultValue !== undefined) return defaultValue;
		return result;
	}, [field, adapter, searchParams, defaultValue]);

	const setValue = useCallback(
		(value: T | null) => {
			if (!value) return setSearchParams(field, []);
			const serialize = adapter.serialize || String;
			setSearchParams(field, serialize(value));
		},
		[field, adapter.serialize, setSearchParams]
	);

	return [value, setValue];
}
