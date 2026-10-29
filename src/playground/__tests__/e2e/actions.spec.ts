import { test, expect } from '@playwright/test';

test('submitting the form adds a note and refreshes the list', async ({ page }) => {
	await page.goto('/playground/actions');
	const items = page.locator('.pg-list li');
	const calls = page.locator('.pg-badge').filter({ hasText: 'loader calls:' });
	await expect(items).toHaveCount(2);
	await expect(calls).toHaveText('loader calls: 1');

	await page.getByPlaceholder('Note text').fill('e2e note');
	await page.getByRole('button', { name: 'Save' }).click();

	await expect(items).toHaveCount(3);
	await expect(items.filter({ hasText: 'e2e note' })).toBeVisible();
	await expect(calls).toHaveText('loader calls: 2');
});

test('an empty note shows the action error', async ({ page }) => {
	await page.goto('/playground/actions');
	const items = page.locator('.pg-list li');

	await page.getByPlaceholder('Note text').fill('   ');
	await page.getByRole('button', { name: 'Save' }).click();

	await expect(page.getByRole('alert')).toContainText('Note text must not be empty');
	await expect(items).toHaveCount(2);
});

test('manual refresh revalidates without adding a note', async ({ page }) => {
	await page.goto('/playground/actions');
	const items = page.locator('.pg-list li');
	const calls = page.locator('.pg-badge').filter({ hasText: 'loader calls:' });
	await expect(calls).toHaveText('loader calls: 1');

	await page.getByRole('button', { name: 'Refresh list (invalidate)' }).click();

	await expect(calls).toHaveText('loader calls: 2');
	await expect(items).toHaveCount(2);
});
