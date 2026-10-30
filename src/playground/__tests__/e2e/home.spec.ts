import { test, expect } from '@playwright/test';

test('home lists every demo and the gear opens settings', async ({ page }) => {
	await page.goto('/playground');

	await expect(page.locator('.pg-card-home')).toHaveCount(12);
	await expect(page.getByRole('heading', { name: 'Deferred render' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toHaveCount(0);

	await page.locator('.pg-gear-link').click();

	await expect(page).toHaveURL(/\/playground\/settings$/);
	await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
});

test('nav link opens the deferred render demo', async ({ page }) => {
	await page.goto('/playground');

	await page.getByRole('link', { name: 'Deferred', exact: true }).click();

	await expect(page).toHaveURL(/\/playground\/deferred$/);
	await expect(page.getByRole('heading', { name: 'Deferred render' })).toBeVisible();
});

for (const width of [390, 1000]) {
	test(`menu exposes every nav link at ${width}px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 844 });
		await page.goto('/playground');

		const toggle = page.getByRole('button', { name: 'Open navigation menu' });
		await expect(toggle).toBeVisible();
		await toggle.click();

		await expect(page.locator('.pg-nav a:visible')).toHaveCount(14);
		const settings = page.locator('.pg-gear-link');
		await expect(settings).toBeVisible();
	});
}
