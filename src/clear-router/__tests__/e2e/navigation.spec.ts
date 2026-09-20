import { test, expect } from '@playwright/test';

test('navigates via Link and renders the target page', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('page-home')).toBeVisible();

	await page.getByTestId('link-about').click();

	await expect(page.getByTestId('page-about')).toBeVisible();
	await expect(page).toHaveURL(/\/about$/);
});

test('passes params, search and state to the target route', async ({ page }) => {
	await page.goto('/');
	await page.getByTestId('link-user').click();

	await expect(page.getByTestId('page-user')).toHaveText('User 7');
	await expect(page.getByTestId('user-search')).toContainText('?tab=info');
	await expect(page.getByTestId('user-state')).toHaveText('from: home');
});

test('prevLocation back link returns to the previous page', async ({ page }) => {
	await page.goto('/');
	await page.getByTestId('link-user').click();
	await expect(page.getByTestId('page-user')).toBeVisible();

	await page.getByTestId('link-back').click();

	await expect(page.getByTestId('page-home')).toBeVisible();
	await expect(page).toHaveURL(/\/$/);
});

test('browser back button restores the previous page', async ({ page }) => {
	await page.goto('/');
	await page.getByTestId('link-about').click();
	await expect(page.getByTestId('page-about')).toBeVisible();

	await page.goBack();

	await expect(page.getByTestId('page-home')).toBeVisible();
	await expect(page).toHaveURL(/\/$/);
});

test('navigation state survives browser back (history.state)', async ({ page }) => {
	await page.goto('/');
	await page.getByTestId('link-user').click();
	await expect(page.getByTestId('user-state')).toHaveText('from: home');

	await page.getByTestId('link-back').click();
	await expect(page.getByTestId('page-home')).toBeVisible();

	// Back restores the entry from real browser history — state must come from
	// history.state, not from in-memory router state.
	await page.goBack();
	await expect(page.getByTestId('page-user')).toBeVisible();
	await expect(page.getByTestId('user-state')).toHaveText('from: home');
});

test('unknown route renders the 404 page', async ({ page }) => {
	await page.goto('/no-such-page');
	await expect(page.getByTestId('page-404')).toBeVisible();
});
