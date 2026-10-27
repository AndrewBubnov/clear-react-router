import { test, expect } from '@playwright/test';

test('polling updates the tick counter', async ({ page }) => {
	await page.goto('/playground/live');
	const tick = page.locator('.pg-badge').filter({ hasText: 'tick:' });
	await expect(tick).toBeVisible();
	const first = await tick.textContent();

	await expect(tick).not.toHaveText(first ?? '', { timeout: 6000 });
});

test('visualizer keeps the cached entry during polling', async ({ page }) => {
	await page.goto('/playground/live');
	const badge = page.locator('.pg-cache-viz .mantine-Badge-root');
	await expect(badge).toContainText('1 /');

	const counts = await page.evaluate(async () => {
		const seen = new Set<string>();
		const end = performance.now() + 4500;
		while (performance.now() < end) {
			const text = document.querySelector('.pg-cache-viz .mantine-Badge-root')?.textContent?.trim();
			if (text) seen.add(text);
			await new Promise(resolve => setTimeout(resolve, 25));
		}
		return [...seen];
	});

	expect(counts.every(text => text.startsWith('1 /'))).toBe(true);
});

test('visualizer shows polling activity on the cached card', async ({ page }) => {
	await page.goto('/playground/live');
	await expect(page.locator('.pg-cache-viz .mantine-Badge-root')).toContainText('1 /');

	const seen = await page.evaluate(async () => {
		const end = performance.now() + 3000;
		while (performance.now() < end) {
			if (document.querySelector('.pg-cache-viz [data-loading="true"]')) return true;
			await new Promise(resolve => setTimeout(resolve, 25));
		}
		return false;
	});

	expect(seen).toBe(true);
});
