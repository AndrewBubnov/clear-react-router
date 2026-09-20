import { test, expect } from '@playwright/test';

test('restores scroll position on back navigation', async ({ page }) => {
	await page.goto('/long');
	await expect(page.getByTestId('page-long')).toBeVisible();

	await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
	await expect
		.poll(async () => page.evaluate(() => window.scrollY), { timeout: 5000 })
		.toBeGreaterThan(1000);

	// Click the link at the bottom: clicking the top link would make Playwright
	// scroll it into view first, destroying the saved scroll position.
	await page.getByTestId('link-home-bottom').click();
	await expect(page.getByTestId('page-home')).toBeVisible();

	await page.goBack();
	await expect(page.getByTestId('page-long')).toBeVisible();
	await expect
		.poll(async () => page.evaluate(() => window.scrollY), { timeout: 5000 })
		.toBeGreaterThan(1000);
});
