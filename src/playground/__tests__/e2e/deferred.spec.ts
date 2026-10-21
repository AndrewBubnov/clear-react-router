import { test, expect } from '@playwright/test';

test('route shell renders first, chart streams in under its own fallback', async ({ page }) => {
	await page.goto('/playground/deferred');

	await expect(page.getByRole('heading', { name: 'Deferred render' })).toBeVisible();
	await expect(page.getByText('call 1', { exact: true })).toBeVisible();
	await expect(page.locator('.mantine-Skeleton-root').first()).toBeVisible();

	await expect(page.locator('.mantine-RingProgress-root')).toBeVisible({ timeout: 5000 });
	await expect(page.getByText('traffic mix')).toBeVisible();
	await expect(page.locator('.mantine-Skeleton-root')).toHaveCount(0);
});

test('Load again replays the deferred fallback', async ({ page }) => {
	await page.goto('/playground/deferred');
	await expect(page.locator('.mantine-RingProgress-root')).toBeVisible({ timeout: 5000 });

	await page.getByRole('button', { name: 'Load again' }).click();

	await expect(page.locator('.mantine-Skeleton-root').first()).toBeVisible();
	await expect(page.locator('.mantine-RingProgress-root')).toBeVisible({ timeout: 5000 });
	await expect(page.getByText('call 2', { exact: true })).toBeVisible();
});
