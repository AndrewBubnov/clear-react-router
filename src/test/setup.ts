import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation(query => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

Object.defineProperty(window, 'scrollTo', {
	writable: true,
	value: vi.fn(),
});

Object.defineProperty(window, 'requestAnimationFrame', {
	writable: true,
	value: vi.fn(cb => setTimeout(cb, 0)),
});

Object.defineProperty(window, 'cancelAnimationFrame', {
	writable: true,
	value: vi.fn(id => clearTimeout(id)),
});

HTMLDialogElement.prototype.showModal = vi.fn();
HTMLDialogElement.prototype.close = vi.fn();