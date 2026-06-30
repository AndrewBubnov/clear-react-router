import { AdapterType } from '../types/global';

type ZodInterface<T> = {
	safeParse(input: unknown): { success: true; data: T } | { success: false; error: unknown };
};

export const adapter = {
	string: { parse: (params: string[]): string => params[0] || '' },
	stringArray: {
		parse: (params: string[]): string[] => params,
		serialize: (value: string[]): string[] => value,
	},
	integer: {
		parse: (params: string[]): number => {
			const result = parseInt(params[0] || '');
			return isNaN(result) ? 0 : result;
		},
	},
	integerArray: {
		parse: (params: string[]): number[] =>
			params.map(el => {
				const result = parseInt(el);
				return isNaN(result) ? 0 : result;
			}),
		serialize: (value: number[]): string[] => value.map(String),
	},
	float: {
		parse: (params: string[]): number => {
			const result = parseFloat(params[0] || '');
			return isNaN(result) ? 0 : result;
		},
	},
	floatArray: {
		parse: (params: string[]): number[] =>
			params.map(el => {
				const result = parseFloat(el);
				return isNaN(result) ? 0 : result;
			}),
		serialize: (value: number[]): string[] => value.map(String),
	},
	boolean: { parse: (params: string[]): boolean => params[0]?.toLowerCase() === 'true', serialize: String },
	booleanArray: {
		parse: (params: string[]): boolean[] => params.map(el => el.toLowerCase() === 'true'),
		serialize: (value: boolean[]): string[] => value.map(String),
	},
	date: {
		parse: (params: string[]): Date => new Date(Number(params[0])),
		serialize: (arg: Date) => String(arg.getTime()),
	},
	dateArray: {
		parse: (params: string[]): Date[] => params.map(param => new Date(Number(param))),
		serialize: (args: Date[]): string[] => args.map(arg => String(arg.getTime())),
	},
	zodSchema: <T>(schema: ZodInterface<T>): AdapterType<T> => ({
		parse: (params: string[]): T => {
			let parsed: unknown;
			try {
				parsed = params[0] ? JSON.parse(params[0]) : undefined;
			} catch {
				throw new Error('Invalid JSON');
			}
			if (parsed === undefined) return undefined as T;
			const result = schema.safeParse(parsed);
			if (!result.success) throw new Error('Invalid schema');
			return result.data;
		},
		serialize: JSON.stringify,
	}),
};
