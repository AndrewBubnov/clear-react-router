import { test, expect } from '@playwright/test';

test('submitting the form adds a note and refreshes the list', async ({ page }) => {
	await page.goto('/playground/actions');
	const items = page.locator('.pg-list li');
	await expect(items).toHaveCount(2);

	await page.getByPlaceholder('Note text').fill('e2e note');
	await page.getByRole('button', { name: 'Save' }).click();

	await expect(items).toHaveCount(3);
	await expect(items.filter({ hasText: 'e2e note' })).toBeVisible();
});
