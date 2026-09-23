import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './src/clear-router/__tests__/e2e',
	retries: process.env.CI ? 2 : 0,
	use: {
		baseURL: 'http://localhost:5174',
		trace: 'on-first-retry',
	},
	webServer: {
		command: 'npx vite --port 5174',
		env: { VITE_E2E: '1' },
		url: 'http://localhost:5174',
		reuseExistingServer: !process.env.CI,
	},
	projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
