import { test, expect } from '@playwright/test';

test('polling updates the tick counter', async ({ page }) => {
	await page.goto('/playground/live');
	const tick = page.locator('.pg-badge').filter({ hasText: 'tick:' });
	await expect(tick).toBeVisible();
	const first = await tick.textContent();

	await expect(tick).not.toHaveText(first ?? '', { timeout: 6000 });
});
