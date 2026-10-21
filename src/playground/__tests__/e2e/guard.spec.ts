import { test, expect } from '@playwright/test';

test('guard redirects to login, then lets the authorized user through', async ({ page }) => {
	await page.goto('/playground/guard');

	await page.getByRole('link', { name: /Try opening dashboard/ }).click();

	await expect(page).toHaveURL(/\/playground\/guard$/);
	await expect(page.getByText(/requires login/)).toBeVisible();

	await page.getByRole('button', { name: 'Log in' }).click();
	await page.getByRole('link', { name: /Try opening dashboard/ }).click();

	await expect(page).toHaveURL(/\/playground\/dashboard$/);
	await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
