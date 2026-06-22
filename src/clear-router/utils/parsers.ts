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
