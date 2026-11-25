import { test, expect, type Page } from '@playwright/test';

const loads = (page: Page) => page.getByTestId('table-loads');
const loadsValue = async (page: Page) => Number((await loads(page).textContent())?.split('#')[1]);

test('brand checkboxes use multi-value params and narrow rows on the server', async ({ page }) => {
	await page.goto('/playground/search');
	await expect(page.getByTestId('table-rows')).toContainText('1001');
	const firstLoads = await loadsValue(page);

	await page.getByTestId('brand-nike').check();
	await expect(loads(page)).toHaveText(`loader call #${firstLoads + 1}`);
	await page.getByTestId('brand-reebok').check();
	await expect(page).toHaveURL(url => {
		const brands = url.searchParams.getAll('brand');
		return brands.includes('nike') && brands.includes('reebok');
	});
	await expect(page.getByTestId('table-variants')).toHaveText('["nike","reebok"]');
	await expect(loads(page)).toHaveText(`loader call #${firstLoads + 2}`);
	const brandCells = await page.getByTestId('table-rows').locator('tr td:nth-child(3)').allTextContents();
	expect(brandCells).toHaveLength(8); // one page of TABLE_PAGE_SIZE
	expect(brandCells.every(brand => brand === 'nike' || brand === 'reebok')).toBe(true);

	// Unchecking both returns the exact initial URL — cached, no loader call.
	await page.getByTestId('brand-nike').uncheck();
	await page.getByTestId('brand-reebok').uncheck();
	await expect(page).toHaveURL(url => url.search === '');
	await expect(page.getByTestId('table-rows')).toContainText('1001');
	// The loader takes ~350ms: a re-fetch would move the counter while we poll.
	// The cached payload is the one from the initial load, hence firstLoads.
	await expect(async () => {
		expect(await loads(page).textContent()).toBe(`loader call #${firstLoads}`);
	}).toPass({ timeout: 1500 });
});

test('sorting goes through the loader; clearing it returns the cached initial combination', async ({ page }) => {
	await page.goto('/playground/search');
	await expect(page.getByTestId('table-rows')).toContainText('1001');
	const firstLoads = await loadsValue(page);

	await page.getByTestId('sort-product').click();
	await expect(page).toHaveURL(url => url.searchParams.get('sort') === 'product');
	await expect(loads(page)).toHaveText(`loader call #${firstLoads + 1}`);
	await expect(page.getByTestId('table-rows').locator('tr').first()).toContainText('Air Zoom');

	await page.getByTestId('sort-product').click();
	await expect(page).toHaveURL(url => url.searchParams.get('dir') === 'desc');
	await expect(loads(page)).toHaveText(`loader call #${firstLoads + 2}`);
	await expect(page.getByTestId('table-rows').locator('tr').first()).toContainText('Ultraboost');

	await page.getByTestId('sort-product').click();
	await expect(page).toHaveURL(url => url.search === '');
	await expect(page.getByTestId('table-rows')).toContainText('1001');
	await expect(async () => {
		expect(await loads(page).textContent()).toBe(`loader call #${firstLoads}`);
	}).toPass({ timeout: 1500 });
});

test('text filter narrows rows on the server', async ({ page }) => {
	await page.goto('/playground/search');
	await expect(page.getByTestId('table-rows')).toContainText('1001');
	const firstLoads = await loadsValue(page);

	await page.getByTestId('table-q').fill('reebok');
	await page.getByTestId('table-q').press('Enter');

	await expect(page).toHaveURL(url => url.searchParams.get('q') === 'reebok');
	await expect(loads(page)).toHaveText(`loader call #${firstLoads + 1}`);
	const brandCells = await page.getByTestId('table-rows').locator('tr td:nth-child(3)').allTextContents();
	expect(brandCells).toHaveLength(8);
	expect(brandCells.every(brand => brand === 'reebok')).toBe(true);
	await expect(page.getByTestId('table-page')).toHaveText('page 1 / 2');
});

test('pagination keeps the filter and walks back to the cached first page', async ({ page }) => {
	await page.goto('/playground/search');
	await expect(page.getByTestId('table-rows')).toContainText('1001');
	const firstLoads = await loadsValue(page);

	await page.getByTestId('table-next').click();
	await expect(page).toHaveURL(url => url.searchParams.get('page') === '2');
	await expect(loads(page)).toHaveText(`loader call #${firstLoads + 1}`);
	await expect(page.getByTestId('table-rows')).toContainText('1009');
	await expect(page.getByTestId('table-prev')).toBeEnabled();

	await page.getByTestId('table-prev').click();
	await expect(page).toHaveURL(url => url.search === '');
	await expect(page.getByTestId('table-rows')).toContainText('1001');
	// The cached payload is the one from the initial load, hence firstLoads.
	await expect(async () => {
		expect(await loads(page).textContent()).toBe(`loader call #${firstLoads}`);
	}).toPass({ timeout: 1500 });
});
