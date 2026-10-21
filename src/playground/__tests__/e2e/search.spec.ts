import { test, expect } from '@playwright/test';

test('clicking a brand toggles it in the query string', async ({ page }) => {
	await page.goto('/playground/search');
	await expect(page.getByTestId('search-url')).toHaveText('(empty)');
	await expect(page.getByTestId('search-brand')).toHaveText('""');

	await page.getByRole('button', { name: 'nike' }).click();

	await expect(page).toHaveURL(url => url.searchParams.get('brand') === 'nike');
	await expect(page.getByTestId('search-url')).toHaveText('brand=nike');
	await expect(page.getByTestId('search-brand')).toHaveText('"nike"');

	await page.getByRole('button', { name: 'nike' }).click();

	await expect(page).toHaveURL(url => !url.searchParams.has('brand'));
});

test('Clear all removes every search param', async ({ page }) => {
	await page.goto('/playground/search');
	await page.getByRole('button', { name: 'nike' }).click();
	await page.getByRole('button', { name: 'page=2' }).click();
	await expect(page).toHaveURL(url => url.searchParams.get('page') === '2');

	await page.getByRole('button', { name: 'Clear all' }).click();

	await expect(page).toHaveURL(url => url.search === '');
	await expect(page.getByTestId('search-url')).toHaveText('(empty)');
	await expect(page.getByRole('button', { name: 'Clear all' })).toBeDisabled();
});
