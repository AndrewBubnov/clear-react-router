import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';

afterEach(() => {
	cleanup();
});

beforeAll(() => {
	window.history.pushState({}, '', '/');
});

afterAll(() => {
	window.history.pushState({}, '', '/');
});
