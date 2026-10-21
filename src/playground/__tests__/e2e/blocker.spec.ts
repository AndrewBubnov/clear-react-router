import { test, expect } from '@playwright/test';

test('dirty form blocks navigation until Stay is chosen', async ({ page }) => {
	await page.goto('/playground/blocker');
	await page.getByPlaceholder(/Type to make the form dirty/).fill('unsaved');
	await expect(page.locator('.pg-badge').filter({ hasText: 'blocker:' })).toHaveText('blocker: charged');

	await page.getByRole('link', { name: /Try leaving/ }).click();

	await expect(page.getByRole('dialog')).toBeVisible();
	await expect(page).toHaveURL(/\/playground\/blocker$/);

	await page.getByRole('button', { name: 'Stay' }).click();

	await expect(page.getByRole('dialog')).toBeHidden();
	await expect(page).toHaveURL(/\/playground\/blocker$/);
});

test('confirming leaves the dirty page', async ({ page }) => {
	await page.goto('/playground/blocker');
	await page.getByPlaceholder(/Type to make the form dirty/).fill('unsaved');
	await page.getByRole('link', { name: /Try leaving/ }).click();
	await expect(page.getByRole('dialog')).toBeVisible();

	await page.getByRole('button', { name: 'Leave' }).click();

	await expect(page).toHaveURL(/\/playground$/);
	await expect(page.getByRole('heading', { name: 'Clear Router Playground' })).toBeVisible();
});
