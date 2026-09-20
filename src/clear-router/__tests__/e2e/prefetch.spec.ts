import { test, expect } from '@playwright/test';

const aboutCalls = (page: import('@playwright/test').Page) =>
	page.evaluate(
		() => (window as unknown as { __loaderCalls?: Record<string, number> }).__loaderCalls?.about ?? 0
	);

const aboutDone = (page: import('@playwright/test').Page) =>
	page.evaluate(
		() => (window as unknown as { __loaderDone?: Record<string, number> }).__loaderDone?.about ?? 0
	);

test('hover prefetches loader data for instant navigation', async ({ page }) => {
	await page.goto('/');
	await page.getByTestId('link-about').hover();

	// Wait for the prefetch to complete, not just start — clicking mid-prefetch
	// would (by design) abort it and refetch for the navigation instead.
	await expect.poll(() => aboutDone(page), { timeout: 5000 }).toBe(1);

	await page.getByTestId('link-about').click();

	await expect(page.getByTestId('page-about')).toBeVisible();
	await expect(page.getByTestId('page-about')).toContainText('about-data-1');
	expect(await aboutCalls(page)).toBe(1);
});

test('prefetch=none does not fetch until click', async ({ page }) => {
	await page.goto('/');

	await page.getByTestId('link-about-noprefetch').hover();
	await page.waitForTimeout(500);
	expect(await aboutCalls(page)).toBe(0);

	await page.getByTestId('link-about-noprefetch').click();

	await expect(page.getByTestId('page-about')).toBeVisible();
	expect(await aboutCalls(page)).toBe(1);
});
