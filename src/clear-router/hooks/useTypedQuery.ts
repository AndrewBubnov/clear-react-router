import { useSearchParams } from './useSearchParams.ts';
import { useCallback, useMemo } from 'react';

type UseQueryOptions =
	| { type: 'string'; defaultValue?: string }
	| { type: 'string-array'; defaultValue?: string[] }
	| { type: 'integer' | 'float'; defaultValue?: number }
	| { type: 'integer-array' | 'float-array'; defaultValue?: number[] }
	| { type: 'boolean'; defaultValue?: boolean }
	| { type: 'boolean-array'; defaultValue?: boolean[] };

type FieldType = UseQueryOptions['type'];

type ParserReturnType<T extends FieldType> = T extends 'integer-array' | 'float-array'
	? number[]
	: T extends 'integer' | 'float'
		? number
		: T extends 'boolean-array'
			? boolean[]
			: T extends 'string-array'
				? string[]
				: T extends 'boolean'
					? boolean
					: string;

type ParserMap = {
	[K in FieldType]: (params: string[]) => ParserReturnType<K>;
};

const stringParser = (params: string[]): string => params[0] || '';
const parseStringArray = (params: string[]): string[] => params;
const integerParser = (params: string[]): number => {
	const result = parseInt(params[0] || '', 10);
	return isNaN(result) ? 0 : result;
};
const integerArrayParser = (params: string[]): number[] =>
	params.map(el => {
		const result = parseInt(el, 10);
		return isNaN(result) ? 0 : result;
	});
const floatParser = (params: string[]): number => {
	const result = parseFloat(params[0] || '');
	return isNaN(result) ? 0 : result;
};
const floatArrayParser = (params: string[]): number[] =>
	params.map(el => {
		const result = parseFloat(el);
		return isNaN(result) ? 0 : result;
	});
const booleanParser = (params: string[]): boolean => params[0]?.toLowerCase() === 'true';
const booleanArrayParser = (params: string[]): boolean[] => params.map(el => el.toLowerCase() === 'true');

const parserMap: ParserMap = {
	'string': stringParser,
	'string-array': parseStringArray,
	'integer': integerParser,
	'integer-array': integerArrayParser,
	'float': floatParser,
	'float-array': floatArrayParser,
	'boolean': booleanParser,
	'boolean-array': booleanArrayParser,
};

export function useTypedQuery<T extends UseQueryOptions['type']>(
	field: string,
	options?: { type?: T; defaultValue?: ParserReturnType<T> }
): [ParserReturnType<T>, (arg: ParserReturnType<T>) => void] {
	const { searchParams, setSearchParams } = useSearchParams();
	const { type = 'string' as T, defaultValue } = options || {};

	const value = useMemo(() => {
		const params = searchParams.getAll(field);

		const parser = parserMap[type];
		const result = parser(params);

		if (result !== undefined && result !== null && result !== '') return result;
		if (defaultValue !== undefined) return defaultValue;
		return result;
	}, [defaultValue, field, searchParams, type]);

	const setValue = useCallback(
		(value: ParserReturnType<T>) => setSearchParams(field, value.toString()),
		[setSearchParams, field]
	);

	return [value, setValue];
}
