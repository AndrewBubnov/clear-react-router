import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Router } from '..';
import { routes } from './common';

const TEST_TIMEOUT = 10000;

describe('Router integration', () => {
	beforeEach(() => {
		window.history.pushState({}, '', '/');
	});

	it(
		'renders home page after loader completes',
		async () => {
			render(<Router routes={routes} />);
			await waitFor(
				() => {
					expect(screen.getByText(/Home/i)).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);
		},
		TEST_TIMEOUT
	);

	it(
		'renders fallback while loader is pending',
		async () => {
			window.history.pushState({}, '', '/about');
			render(<Router routes={routes} />);
			await waitFor(
				() => {
					expect(screen.getByText(/Loading About/i)).toBeInTheDocument();
				},
				{ timeout: 3000 }
			);
		},
		TEST_TIMEOUT
	);

	it(
		'navigates via Link component',
		async () => {
			render(<Router routes={routes} />);
			await waitFor(
				() => {
					expect(screen.getByText(/Home/i)).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);

			const aboutLink = screen.getByText('To about page');
			aboutLink.click();

			await waitFor(
				() => {
					expect(screen.getByText(/About/i)).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);
		},
		TEST_TIMEOUT
	);

	it(
		'renders NotFound for unknown routes',
		async () => {
			window.history.pushState({}, '', '/unknown');
			render(<Router routes={routes} />);
			await waitFor(
				() => {
					expect(screen.getByText(/Not Found/i)).toBeInTheDocument();
				},
				{ timeout: 3000 }
			);
		},
		TEST_TIMEOUT
	);

	it(
		'handles nested routes with params',
		async () => {
			window.history.pushState({}, '', '/user/123');
			render(<Router routes={routes} />);
			await waitFor(
				() => {
					expect(screen.getByText(/User 123/i)).toBeInTheDocument();
				},
				{ timeout: 3000 }
			);
		},
		TEST_TIMEOUT
	);

	it(
		'shows loader fallback during navigation',
		async () => {
			render(<Router routes={routes} />);
			await waitFor(
				() => {
					expect(screen.getByText(/Home/i)).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);

			const aboutLink = screen.getByText('To about page');
			aboutLink.click();

			await waitFor(
				() => {
					expect(screen.getByText(/Loading About/i)).toBeInTheDocument();
				},
				{ timeout: 3000 }
			);
		},
		TEST_TIMEOUT
	);
});

describe('Link component', () => {
	it(
		'renders anchor with href',
		async () => {
			render(<Router routes={routes} />);
			await waitFor(
				() => {
					expect(screen.getByText(/Home/i)).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);
			const link = screen.getByRole('link', { name: /to about page/i });
			expect(link).toHaveAttribute('href', '/about');
		},
		TEST_TIMEOUT
	);

	it(
		'navigates on click',
		async () => {
			render(<Router routes={routes} />);
			await waitFor(
				() => {
					expect(screen.getByText(/Home/i)).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);

			const aboutLink = screen.getByText('To about page');
			aboutLink.click();

			await waitFor(
				() => {
					expect(screen.getByText(/About/i)).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);
		},
		TEST_TIMEOUT
	);
});
