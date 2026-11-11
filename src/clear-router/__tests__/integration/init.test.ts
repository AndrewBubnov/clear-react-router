import { afterEach, describe, expect, it, vi } from 'vitest';

describe('library init', () => {
	afterEach(() => {
		vi.resetModules();
		vi.restoreAllMocks();
	});

	it('imports without window.matchMedia', async () => {
		const originalMatchMedia = window.matchMedia;
		(window as { matchMedia?: typeof window.matchMedia }).matchMedia = undefined;
		vi.resetModules();
		try {
			await expect(import('../../instance')).resolves.toBeDefined();
		} finally {
			window.matchMedia = originalMatchMedia;
		}
	});
});
