import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './src/playground/__tests__/e2e',
	retries: process.env.CI ? 2 : 0,
	use: {
		baseURL: 'http://localhost:5175',
		trace: 'on-first-retry',
	},
	webServer: {
		command: 'npx vite --port 5175 --strictPort',
		url: 'http://localhost:5175',
		reuseExistingServer: !process.env.CI,
	},
	projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
