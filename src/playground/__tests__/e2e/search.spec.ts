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

test('filter changes run the loader; Back renders a visited combination from cache', async ({ page }) => {
	const loads = () => page.getByTestId('search-loads');
	const results = () => page.getByTestId('search-results');

	const loadsValue = async () => Number((await loads().textContent())?.split('#')[1]);

	await page.goto('/playground/search');
	await expect(results()).toContainText('adidas Samba'); // empty query = full list
	const firstLoads = await loadsValue();

	await page.getByRole('button', { name: 'nike' }).click();
	await expect(page).toHaveURL(url => url.searchParams.get('brand') === 'nike');
	await expect(results()).toContainText('nike Pegasus');
	await expect(results()).not.toContainText('reebok Nano');
	await expect(loads()).toHaveText(`loader call #${firstLoads + 1}`);

	await page.getByRole('button', { name: 'reebok' }).click();
	await expect(results()).toContainText('reebok Nano');
	await expect(loads()).toHaveText(`loader call #${firstLoads + 2}`);

	// Back: the visited nike combination is a fresh cache entry — no loader call.
	await page.goBack();
	await expect(page).toHaveURL(url => url.searchParams.get('brand') === 'nike');
	await expect(results()).toContainText('nike Pegasus');
	await expect(results()).not.toContainText('reebok Nano');
	// The loader takes ~400ms: if the combination were re-fetched the counter
	// would move on while we poll — staying put proves the cache hit.
	await expect(async () => {
		expect(await loads().textContent()).toBe(`loader call #${firstLoads + 1}`);
	}).toPass({ timeout: 1500 });
});
