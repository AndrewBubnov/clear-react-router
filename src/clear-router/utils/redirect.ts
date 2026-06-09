export class Redirect {
	url: string;
	search?: string;
	cause: 'redirect';
	constructor(url: string, search?: string) {
		this.url = url;
		this.search = search;
		this.cause = 'redirect';
	}
}

export const redirect = (url: string, search?: string) => Promise.reject(new Redirect(url, search));
