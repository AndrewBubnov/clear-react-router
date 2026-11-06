import { test, expect } from '@playwright/test';
import { DEFAULT_MAX_CACHE_SIZE } from '../../constants.ts';

test('animated transitions toggle enables the duration controls', async ({ page }) => {
	await page.goto('/playground/settings');
	const toggle = page.getByLabel('animated transitions');
	const slider = page.locator('[aria-label="Animation duration in milliseconds"]');
	const reset = page.getByRole('button', { name: 'Reset' });

	await expect(toggle).not.toBeChecked();
	await expect(slider).toBeDisabled();
	await expect(reset).toBeDisabled();

	await toggle.focus();
	await page.keyboard.press('Space');
	await expect(toggle).toBeChecked();
	await expect(slider).toBeEnabled();
	await expect(reset).toBeEnabled();

	await slider.press('ArrowRight');
	await expect(slider).toHaveAttribute('aria-valuenow', '510');

	await reset.click();
	await expect(slider).toHaveAttribute('aria-valuenow', '500');
});

test('cache size setting applies to the cache page', async ({ page }) => {
	await page.goto('/playground/settings');
	const slider = page.getByRole('slider', { name: 'Maximum number of cached loader entries' });

	await expect(slider).toHaveAttribute('aria-valuenow', String(DEFAULT_MAX_CACHE_SIZE));
	await slider.press('ArrowRight');
	await expect(slider).toHaveAttribute('aria-valuenow', String(DEFAULT_MAX_CACHE_SIZE + 1));

	await page.getByRole('link', { name: 'Cache', exact: true }).click();

	await expect(page.getByRole('heading', { name: /Cache: eviction/ })).toBeVisible();
	await expect(page.locator('.pg-card').filter({ hasText: 'This playground runs with' })).toContainText(
		`maxCacheSize: ${String(DEFAULT_MAX_CACHE_SIZE + 1)}`
	);
});

test('nav link element setting changes the rendered links live', async ({ page }) => {
	await page.goto('/playground/settings');
	const cacheLink = page.locator('.pg-nav').getByRole('link', { name: 'Cache', exact: true });

	await expect(cacheLink).not.toHaveClass(/mantine-Button-root/);
	await expect(cacheLink).toHaveClass(/pg-nav-link/);

	await page.getByRole('radiogroup', { name: 'Nav link element' }).getByText('Mantine button').click();

	await expect(cacheLink).toHaveClass(/mantine-Button-root/);
	await expect(cacheLink).toHaveAttribute('data-variant', 'subtle');

	const preview = page.locator('.pg-nav-presets a.mantine-Button-root');
	await expect(preview).toHaveAttribute('data-variant', 'gradient');
	await expect(preview).toHaveCSS('color', 'rgb(255, 255, 255)');

	await cacheLink.click();
	await expect(page.getByRole('heading', { name: /Cache: eviction/ })).toBeVisible();
	await expect(cacheLink).toHaveAttribute('data-variant', 'gradient');
	await expect(cacheLink).toHaveCSS('color', 'rgb(255, 255, 255)');
});

test('prefetch strategy switches with Mantine segmented control', async ({ page }) => {
	await page.goto('/playground/settings');
	const group = page.getByRole('radiogroup', { name: 'Link prefetch strategy' });
	const auto = group.getByRole('radio', { name: 'auto' });
	const hover = group.getByRole('radio', { name: 'hover' });

	await expect(auto).toBeChecked();
	await group.getByText('hover', { exact: true }).click();
	await expect(hover).toBeChecked();
	await expect(auto).not.toBeChecked();
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
