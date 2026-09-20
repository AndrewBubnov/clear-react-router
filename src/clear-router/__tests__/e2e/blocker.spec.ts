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

test('browser back is blocked and the URL is reverted', async ({ page }) => {
	await page.goto('/');
	await page.getByTestId('link-form').click();
	await expect(page.getByTestId('page-form')).toBeVisible();

	await page.getByTestId('form-input').fill('unsaved');
	await expect(page.getByTestId('blocker-state')).toHaveText('charged');

	await page.goBack();

	await expect(page.getByTestId('blocker-dialog')).toBeVisible();
	await expect(page).toHaveURL(/\/form$/);

	await page.getByTestId('blocker-confirm').click();
	await expect(page.getByTestId('page-home')).toBeVisible();
});
