type ZodInterface<T> = {
	safeParse(input: unknown): { success: true; data: T } | { success: false; error: unknown };
};

export const stringParser = (params: string[]): string => params[0] || '';
export const parseStringArray = (params: string[]): string[] => params;
export const integerParser = (params: string[]): number => {
	const result = parseInt(params[0] || '', 10);
	return isNaN(result) ? 0 : result;
};
export const integerArrayParser = (params: string[]): number[] =>
	params.map(el => {
		const result = parseInt(el, 10);
		return isNaN(result) ? 0 : result;
	});
export const floatParser = (params: string[]): number => {
	const result = parseFloat(params[0] || '');
	return isNaN(result) ? 0 : result;
};
export const floatArrayParser = (params: string[]): number[] =>
	params.map(el => {
		const result = parseFloat(el);
		return isNaN(result) ? 0 : result;
	});
export const booleanParser = (params: string[]): boolean => params[0]?.toLowerCase() === 'true';
export const booleanArrayParser = (params: string[]): boolean[] => params.map(el => el.toLowerCase() === 'true');
export const zodSchemaParser = <S extends ZodInterface<unknown>>(schema: S) => {
	type T = S extends ZodInterface<infer R> ? R : never;
	return (params: string[]): T => {
		let parsed: unknown;
		try {
			parsed = JSON.parse(params[0] ?? '{}');
		} catch {
			throw new Error('Invalid JSON');
		}
		const result = schema.safeParse(parsed);
		if (!result.success) throw new Error('Invalid schema');
		return result.data as T;
	};
};
