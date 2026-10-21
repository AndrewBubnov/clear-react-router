import { test, expect } from '@playwright/test';

test('layout state survives navigation into nested children', async ({ page }) => {
	await page.goto('/playground/nest');
	const count = page.locator('.pg-layout-bar .mantine-Badge-root').filter({ hasText: 'count:' });

	await page.getByRole('button', { name: 'Increment' }).click();
	await expect(count).toHaveText('count: 1');

	await page.locator('.pg-wrap .pg-row a').first().click();
	await expect(page.getByRole('heading', { name: /^Nest nest-\d+$/ })).toBeVisible();
	await expect(count).toHaveText('count: 1');

	await page.locator('.pg-wrap .pg-row a').first().click();
	await expect(page.getByRole('heading', { name: /^Item item-\d+ of nest nest-\d+$/ })).toBeVisible();
	await expect(count).toHaveText('count: 1');
});
