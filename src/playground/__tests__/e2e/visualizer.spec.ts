import { test, expect } from '@playwright/test';

test('visualizer marks a cached entry stale after staleTime', async ({ page }) => {
	await page.goto('/playground/optimistic');
	const dot = page.locator('.pg-cache-viz [data-freshness]').first();

	await expect(page.locator('.pg-cache-viz').getByText('fresh', { exact: true })).toBeVisible();
	await expect(page.locator('.pg-cache-viz').getByText('stale', { exact: true })).toBeVisible();
	await expect(dot).toHaveAttribute('data-freshness', 'fresh');
	await expect(dot).toHaveAttribute('data-freshness', 'stale', { timeout: 5000 });
});
