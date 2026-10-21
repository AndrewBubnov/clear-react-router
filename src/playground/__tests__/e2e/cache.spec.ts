import { test, expect } from '@playwright/test';

test('invalidating the current route refetches it and reports the entry', async ({ page }) => {
	await page.goto('/playground/cache');
	const current = page.locator('.pg-card').first();
	await expect(current).toContainText('Cache lab payload (call 1)');

	await page.getByRole('button', { name: 'Refetch this page' }).click();

	await expect(page.getByText('Invalidation results')).toBeVisible();
	await expect(page.locator('.pg-invalidate-result__entry')).toContainText('/playground/cache');
	await expect(current).toContainText('Cache lab payload (call 2)');
});
