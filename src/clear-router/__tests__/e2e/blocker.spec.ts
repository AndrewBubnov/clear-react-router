import { test, expect } from '@playwright/test';

test('blocks Link navigation while dirty, cancel stays on the page', async ({ page }) => {
	await page.goto('/form');
	await page.getByTestId('form-input').fill('unsaved');
	await expect(page.getByTestId('blocker-state')).toHaveText('charged');

	await page.getByTestId('link-home').click();

	await expect(page.getByTestId('blocker-dialog')).toBeVisible();
	await expect(page).toHaveURL(/\/form$/);

	await page.getByTestId('blocker-cancel').click();

	await expect(page.getByTestId('blocker-dialog')).toBeHidden();
	await expect(page.getByTestId('page-form')).toBeVisible();
	await expect(page).toHaveURL(/\/form$/);
});

test('confirm completes the blocked navigation', async ({ page }) => {
	await page.goto('/form');
	await page.getByTestId('form-input').fill('unsaved');
	await expect(page.getByTestId('blocker-state')).toHaveText('charged');

	await page.getByTestId('link-home').click();
	await expect(page.getByTestId('blocker-dialog')).toBeVisible();

	await page.getByTestId('blocker-confirm').click();

	await expect(page.getByTestId('page-home')).toBeVisible();
	await expect(page).toHaveURL(/\/$/);
});

test('browser back is blocked without adding history entries', async ({ page }) => {
	await page.goto('/');
	await page.getByTestId('link-form').click();
	await expect(page.getByTestId('page-form')).toBeVisible();

	await page.getByTestId('form-input').fill('unsaved');
	await expect(page.getByTestId('blocker-state')).toHaveText('charged');

	const historyLength = await page.evaluate(() => history.length);

	await page.evaluate(() => history.back());
	await expect(page.getByTestId('blocker-dialog')).toBeVisible();
	await expect(page).toHaveURL(/\/form$/);
	expect(await page.evaluate(() => history.length)).toBe(historyLength);

	await page.evaluate(() => history.back());
	await expect(page.getByTestId('blocker-dialog')).toBeVisible();
	await expect(page).toHaveURL(/\/form$/);
	expect(await page.evaluate(() => history.length)).toBe(historyLength);

	await page.getByTestId('blocker-confirm').click();
	await expect(page.getByTestId('page-home')).toBeVisible();
});
