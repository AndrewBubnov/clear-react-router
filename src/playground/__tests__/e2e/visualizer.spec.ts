import { test, expect, Page, Locator } from '@playwright/test';

test('visualizer shows existing entries when enabled after navigation', async ({ page }) => {
	await page.goto('/playground');
	const toggle = page.getByLabel('visualize cache');
	await toggle.uncheck();
	await page.getByRole('link', { name: 'Cache', exact: true }).click();
	await expect(page.getByRole('heading', { name: /Cache: eviction/ })).toBeVisible();

	await toggle.check();

	const visualizer = page.locator('.pg-cache-viz');
	await expect(visualizer.getByText('cache', { exact: true })).toBeVisible();
});

const vizDot = (page: Page) => page.locator('.pg-cache-viz .pg-battery-dot').first();

test('visualizer marks a cached entry stale after staleTime', async ({ page }) => {
	const dotColor = (dot: Locator) => dot.evaluate(el => getComputedStyle(el).backgroundColor);

	await page.goto('/playground/optimistic');
	const viz = page.locator('.pg-cache-viz');
	const dot = vizDot(page);

	await expect(viz.getByText('fresh', { exact: true })).toBeVisible();
	await expect(viz.getByText('stale', { exact: true })).toBeVisible();

	const freshColor = await dotColor(dot);
	await expect(dot).not.toHaveCSS('background-color', freshColor, { timeout: 5000 });
});

test('visualizer keeps an already-stale entry stale after remounting', async ({ page }) => {
	const dotColor = (dot: Locator) => dot.evaluate(el => getComputedStyle(el).backgroundColor);

	await page.goto('/playground/optimistic');
	const dot = vizDot(page);

	const freshColor = await dotColor(dot);
	await expect(dot).not.toHaveCSS('background-color', freshColor, { timeout: 5000 });
	// pg-dot-stale animates for 200ms; capture the settled color — a
	// mid-transition frame does not survive the remount. Color sampling is not
	// reliable here (headless throttles frames, so mid-animation samples can
	// repeat), so poll the animation state itself.
	await expect
		.poll(() => dot.evaluate(el => el.getAnimations().every(a => a.playState === 'finished')), {
			timeout: 3000,
		})
		.toBe(true);
	const staleColor = await dotColor(dot);
	const toggle = page.getByLabel('visualize cache');
	await toggle.uncheck();
	await expect(page.locator('.pg-cache-viz')).toHaveCount(0);
	await toggle.check();

	await expect(dot).toHaveCSS('background-color', staleColor, { timeout: 500 });
});
