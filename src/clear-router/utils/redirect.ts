export const redirect = (url: string, search?: string) => {
	const error = new Error();
	error.cause = 'redirect';
	throw Object.assign(error, { url, search: search || '' });
};
