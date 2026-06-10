import { describe, it, expect } from 'vitest';
import { Redirect, redirect } from '../utils/redirect.ts';

describe('redirect', () => {
	it('returns a rejected promise with Redirect instance', async () => {
		try {
			await redirect('/login');
		} catch (error) {
			expect(error).toBeInstanceOf(Redirect);
			expect((error as Redirect).url).toBe('/login');
			expect((error as Redirect).search).toBeUndefined();
			expect((error as Redirect).cause).toBe('redirect');
		}
	});

	it('includes search params when provided', async () => {
		try {
			await redirect('/login', '?from=/dashboard');
		} catch (error) {
			expect(error).toBeInstanceOf(Redirect);
			expect((error as Redirect).url).toBe('/login');
			expect((error as Redirect).search).toBe('?from=/dashboard');
		}
	});
});
