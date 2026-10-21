import { test, expect } from '@playwright/test';

test('clicking a brand toggles it in the query string', async ({ page }) => {
	await page.goto('/playground/search');
	await expect(page.getByText('URL query:')).toContainText('(empty)');

	await page.getByRole('button', { name: 'nike' }).click();

	await expect(page).toHaveURL(url => url.searchParams.get('brand') === 'nike');
	await expect(page.getByText('URL query:')).toContainText('brand=nike');

	await page.getByRole('button', { name: 'nike' }).click();

	await expect(page).toHaveURL(url => !url.searchParams.has('brand'));
});
