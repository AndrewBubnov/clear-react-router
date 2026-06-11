import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],

	build: {
		lib: {
			entry: 'index.ts',
			formats: ['es'],
			fileName: () => 'index.js',
		},

		rollupOptions: {
			external: ['react', 'react-dom'],
		},
	},
});
