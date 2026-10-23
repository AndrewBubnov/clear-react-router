import { test, expect } from '@playwright/test';

test('visualizer shows existing entries when enabled after navigation', async ({ page }) => {
	await page.goto('/playground');
	const toggle = page.getByLabel('visualize cache');
	await toggle.uncheck();
	await page.getByRole('link', { name: 'Cache', exact: true }).click();
	await expect(page.getByRole('heading', { name: /Cache: eviction/ })).toBeVisible();

	await toggle.check();

	const visualizer = page.locator('.pg-cache-viz');
	await expect(visualizer.getByText('cache', { exact: true })).toBeVisible();
});

test('visualizer marks a cached entry stale after staleTime', async ({ page }) => {
	await page.goto('/playground/optimistic');
	const dot = page.locator('.pg-cache-viz [data-freshness]').first();

	await expect(page.locator('.pg-cache-viz').getByText('fresh', { exact: true })).toBeVisible();
	await expect(page.locator('.pg-cache-viz').getByText('stale', { exact: true })).toBeVisible();
	await expect(dot).toHaveAttribute('data-freshness', 'fresh');
	await expect(dot).toHaveAttribute('data-freshness', 'stale', { timeout: 5000 });
});

test('visualizer keeps an already-stale entry stale after remounting', async ({ page }) => {
	await page.goto('/playground/optimistic');
	const dot = page.locator('.pg-cache-viz [data-freshness]').first();
	await expect(dot).toHaveAttribute('data-freshness', 'stale', { timeout: 5000 });

	const toggle = page.getByLabel('visualize cache');
	await toggle.uncheck();
	await expect(page.locator('.pg-cache-viz')).toHaveCount(0);
	await toggle.check();

	await expect(dot).toHaveAttribute('data-freshness', 'stale', { timeout: 500 });
});
