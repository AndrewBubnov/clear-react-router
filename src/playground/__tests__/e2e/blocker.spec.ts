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
	await expect(page.locator('.pg-badge').filter({ hasText: 'blocker:' })).toHaveText('blocker: charged');
});

test('clean form navigates without a dialog', async ({ page }) => {
	await page.goto('/playground/blocker');
	await expect(page.locator('.pg-badge').filter({ hasText: 'blocker:' })).toHaveText('blocker: unblocked');

	await page.getByRole('link', { name: /Try leaving/ }).click();

	await expect(page).toHaveURL(/\/playground$/);
	await expect(page.getByRole('dialog')).toBeHidden();
});

test('clearing the form unblocks navigation', async ({ page }) => {
	await page.goto('/playground/blocker');
	const input = page.getByPlaceholder(/Type to make the form dirty/);
	const status = page.locator('.pg-badge').filter({ hasText: 'blocker:' });

	await input.fill('unsaved');
	await expect(status).toHaveText('blocker: charged');

	await input.fill('');
	await expect(status).toHaveText('blocker: unblocked');

	await page.getByRole('link', { name: /Try leaving/ }).click();

	await expect(page).toHaveURL(/\/playground$/);
	await expect(page.getByRole('dialog')).toBeHidden();
});

test('browser Back is blocked until Stay is chosen', async ({ page }) => {
	await page.goto('/playground');
	await page.getByRole('link', { name: 'Blocker', exact: true }).click();
	await expect(page.getByRole('heading', { name: 'Navigation blocking' })).toBeVisible();

	await page.getByPlaceholder(/Type to make the form dirty/).fill('unsaved');
	await expect(page.locator('.pg-badge').filter({ hasText: 'blocker:' })).toHaveText('blocker: charged');

	await page.evaluate(() => history.back());

	await expect(page.getByRole('dialog')).toBeVisible();
	await expect(page).toHaveURL(/\/playground\/blocker$/);
	await expect(page.locator('.pg-badge').filter({ hasText: 'blocker:' })).toHaveText('blocker: blocked');

	await page.getByRole('button', { name: 'Stay' }).click();

	await expect(page.getByRole('dialog')).toBeHidden();
	await expect(page).toHaveURL(/\/playground\/blocker$/);
	await expect(page.locator('.pg-badge').filter({ hasText: 'blocker:' })).toHaveText('blocker: charged');
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
