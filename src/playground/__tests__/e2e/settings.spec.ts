import { test, expect } from '@playwright/test';

test('animated transitions toggle enables the duration controls', async ({ page }) => {
	await page.goto('/playground/settings');
	const toggle = page.getByLabel('animated transitions');
	const slider = page.locator('[aria-label="Animation duration in milliseconds"]');
	const reset = page.getByRole('button', { name: 'Reset to browser default' });

	await expect(toggle).not.toBeChecked();
	await expect(slider).toBeDisabled();
	await expect(reset).toBeDisabled();

	await toggle.check();
	await expect(slider).toBeEnabled();
	await expect(reset).toBeEnabled();

	await slider.press('ArrowRight');
	await expect(slider).toHaveAttribute('aria-valuenow', '550');

	await reset.click();
	await expect(slider).toHaveAttribute('aria-valuenow', '500');
});

test('cache size setting applies to the cache page', async ({ page }) => {
	await page.goto('/playground/settings');
	const slider = page.getByRole('slider', { name: 'Maximum number of cached loader entries' });

	await expect(slider).toHaveAttribute('aria-valuenow', '3');
	await slider.press('ArrowRight');
	await expect(slider).toHaveAttribute('aria-valuenow', '4');

	await page.getByRole('link', { name: 'Cache', exact: true }).click();

	await expect(page.getByRole('heading', { name: /Cache: eviction/ })).toBeVisible();
	await expect(page.locator('.pg-card').filter({ hasText: 'This playground runs with' })).toContainText(
		'maxCacheSize: 4'
	);
});

test('nav link element setting changes the rendered links live', async ({ page }) => {
	await page.goto('/playground/settings');
	const cacheLink = page.locator('.pg-nav').getByRole('link', { name: 'Cache', exact: true });

	await expect(cacheLink).not.toHaveClass(/mantine-Button-root/);

	await page.getByRole('radio', { name: 'Mantine Button' }).check();

	await expect(cacheLink).toHaveClass(/mantine-Button-root/);
});

test('status badge setting hides and restores the badge', async ({ page }) => {
	await page.goto('/playground/settings');
	const toggle = page.getByLabel('show badge');

	await expect(page.locator('.status-badge')).toBeVisible();

	await toggle.uncheck();
	await expect(page.locator('.status-badge')).toHaveCount(0);

	await toggle.check();
	await expect(page.locator('.status-badge')).toBeVisible();
});
