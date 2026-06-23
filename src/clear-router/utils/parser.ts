type ZodInterface<T> = {
	safeParse(input: unknown): { success: true; data: T } | { success: false; error: unknown };
};

export const parser = {
	string: (params: string[]): string => params[0] || '',
	stringArray: (params: string[]): string[] => params,
	integer: (params: string[]): number => {
		const result = parseInt(params[0] || '', 10);
		return isNaN(result) ? 0 : result;
	},
	integerArray: (params: string[]): number[] =>
		params.map(el => {
			const result = parseInt(el, 10);
			return isNaN(result) ? 0 : result;
		}),
	float: (params: string[]): number => {
		const result = parseFloat(params[0] || '');
		return isNaN(result) ? 0 : result;
	},
	floatArray: (params: string[]): number[] =>
		params.map(el => {
			const result = parseFloat(el);
			return isNaN(result) ? 0 : result;
		}),
	boolean: (params: string[]): boolean => params[0]?.toLowerCase() === 'true',
	booleanArray: (params: string[]): boolean[] => params.map(el => el.toLowerCase() === 'true'),
	zodSchema:
		<T>(schema: ZodInterface<T>) =>
		(params: string[]): T => {
			let parsed: unknown;
			try {
				parsed = JSON.parse(params[0] ?? '{}');
			} catch {
				throw new Error('Invalid JSON');
			}
			const result = schema.safeParse(parsed);
			if (!result.success) throw new Error('Invalid schema');
			return result.data;
		},
};
