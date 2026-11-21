import { test, expect } from '@playwright/test';
import type { QueryClient } from '@tanstack/react-query';

// One behavior per test. The `loads` counter rides inside the quote payload,
// so every badge on the page reads the same fact fetch count reactively.
const counter = (symbol: string, n: number) => `ext-${symbol} calls: ${n}`;

test('first visit runs the loader exactly once', async ({ page }) => {
	await page.goto('/playground/cache/external/CLR');

	await expect(page.getByTestId('ext-snapshot-loads')).toHaveText(counter('CLR', 1));
	await expect(page.getByTestId('ext-live-loads')).toHaveText(counter('CLR', 1));
});

test('router invalidate inside the freshness window does not refetch', async ({ page }) => {
	await page.goto('/playground/cache/external/CLR');
	await expect(page.getByTestId('ext-snapshot-loads')).toHaveText(counter('CLR', 1));

	// Inside TanStack's 5s staleTime window the loader re-runs but resolves
	// from the external cache — the router no longer owns freshness.
	await page.getByTestId('ext-router-invalidate').click();
	await expect(page.getByTestId('ext-snapshot-loads')).toHaveText(counter('CLR', 1));
	await expect(page.getByTestId('ext-live-loads')).toHaveText(counter('CLR', 1));
});

test('TQ invalidate refetches at once, the chained router invalidate does not add a fetch', async ({ page }) => {
	await page.goto('/playground/cache/external/CLR');
	await expect(page.getByTestId('ext-snapshot-loads')).toHaveText(counter('CLR', 1));

	// The active useQuery observer refetches immediately...
	await page.getByTestId('ext-tq-invalidate').click();
	await expect(page.getByTestId('ext-live-loads')).toHaveText(counter('CLR', 2));

	// ...and the chained router invalidate resolves the now-fresh fact from cache.
	await expect(page.getByTestId('ext-snapshot-loads')).toHaveText(counter('CLR', 2));
	await expect(page.getByTestId('ext-live-loads')).toHaveText(counter('CLR', 2));
});

test('router invalidate refetches after the freshness window expires', async ({ page }) => {
	await page.goto('/playground/cache/external/CLR');
	await expect(page.getByTestId('ext-snapshot-loads')).toHaveText(counter('CLR', 1));

	// Control time instead of sleeping: TanStack Query and the router both
	// measure staleness with Date.now(), so fastForward expires the 5s window.
	await page.clock.install();
	await page.clock.fastForward(6000);
	await page.getByTestId('ext-router-invalidate').click();
	await expect(page.getByTestId('ext-snapshot-loads')).toHaveText(counter('CLR', 2), { timeout: 5000 });
});

test('a fact invalidated between hover and click is refetched on navigation', async ({ page }) => {
	await page.goto('/playground/cache/external');

	const link = page.getByTestId('ext-symbol-CLR');
	await link.hover();

	// Wait until the hover prefetch has actually warmed the external cache.
	const cachedData = () =>
		page.evaluate(() =>
			(window as unknown as { __queryClient: QueryClient }).__queryClient.getQueryData(['quote', 'CLR'])
		);
	await expect.poll(cachedData, { timeout: 5000 }).toBeTruthy();

	// Mark the prefetched fact stale before the click happens.
	await page.evaluate(() =>
		(window as unknown as { __queryClient: QueryClient }).__queryClient.invalidateQueries({
			queryKey: ['quote', 'CLR'],
		})
	);

	await link.click();
	// externalCache — the loader re-runs and sees the invalidated fact.
	// With the default 30s window the prefetched snapshot would render stale
	// (loader skipped, TanStack never consulted) and this would read 1.
	await expect(page.getByTestId('ext-loads')).toHaveText(counter('CLR', 2), { timeout: 5000 });
});

test('hover then click performs one external fetch total', async ({ page }) => {
	await page.goto('/playground/cache/external');

	const link = page.getByTestId('ext-symbol-CLR');
	await link.hover();
	await link.click();

	// externalCache — the loader re-runs on navigation, but the fact it
	// loads is deduped by the external cache (fresh or in flight), so exactly
	// one fetch happens regardless of whether the prefetch had time to run.
	await expect(page.getByTestId('ext-loads')).toHaveText(counter('CLR', 1), { timeout: 8000 });
});

test('same route, different param is a different fact', async ({ page }) => {
	await page.goto('/playground/cache/external/CLR');
	await expect(page.getByTestId('ext-loads')).toHaveText(counter('CLR', 1));

	await page.getByTestId('ext-symbol-VITE').click();
	await expect(page.getByTestId('ext-loads')).toHaveText(counter('VITE', 1));

	// Facts are independent: going back to CLR shows CLR's own counter.
	await page.getByTestId('ext-symbol-CLR').click();
	await expect(page.getByTestId('ext-loads')).toHaveText(counter('CLR', 1));
});
