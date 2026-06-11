import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
	plugins: [react()],

	build: {
		target: 'esnext',

		lib: {
			entry: resolve(__dirname, 'index.ts'),
			formats: ['es'],
			fileName: () => 'index.js',
		},

		rollupOptions: {
			external: ['react', 'react-dom'],

			output: {
				format: 'es',
				entryFileNames: 'index.js',
				chunkFileNames: 'chunks/[name].js',

				preserveModules: false,
			},
		},

		sourcemap: false,
		minify: false,
	},
});
