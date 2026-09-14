import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { Router, Link } from '..';
import { routes } from '../../routes';
import { router } from '../instance';

const renderRouter = async (initialPath = '/') => {
	await act(async () => {
		await router.runtime.navigate({ pathname: initialPath, search: '' });
	});
	return render(<Router routes={routes} />);
};

describe('Router integration', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('renders home page initially', async () => {
		await renderRouter('/');
		await act(async () => {
			vi.advanceTimersByTime(2000);
		});
		await waitFor(() => {
			expect(screen.getByText(/Home/i)).toBeInTheDocument();
		});
	});

	it('renders fallback while loader is pending', async () => {
		await renderRouter('/');
		expect(screen.getByText(/Loading Home/i)).toBeInTheDocument();
	});

	it('navigates via Link component', async () => {
		await renderRouter('/');
		await act(async () => {
			vi.advanceTimersByTime(2000);
		});
		await waitFor(() => {
			expect(screen.getByText(/Home/i)).toBeInTheDocument();
		});

		const aboutLink = screen.getByRole('link', { name: /about/i });
		await act(async () => {
			aboutLink.click();
			vi.advanceTimersByTime(2500);
		});
		await waitFor(() => {
			expect(screen.getByText(/About/i)).toBeInTheDocument();
		});
	});

	it('renders NotFound for unknown routes', async () => {
		await renderRouter('/unknown');
		await act(async () => {
			vi.advanceTimersByTime(100);
		});
		await waitFor(() => {
			expect(screen.getByText(/Not Found/i)).toBeInTheDocument();
		});
	});

	it('handles nested routes with params', async () => {
		await renderRouter('/user/123');
		await act(async () => {
			vi.advanceTimersByTime(1500);
		});
		await waitFor(() => {
			expect(screen.getByText(/User 123/i)).toBeInTheDocument();
		});
	});

	it('shows loader fallback during navigation', async () => {
		await renderRouter('/');
		await act(async () => {
			vi.advanceTimersByTime(2000);
		});
		await waitFor(() => {
			expect(screen.getByText(/Home/i)).toBeInTheDocument();
		});

		const aboutLink = screen.getByRole('link', { name: /about/i });
		await act(async () => {
			aboutLink.click();
		});
		expect(screen.getByText(/Loading About/i)).toBeInTheDocument();
	});
});

describe('Link component', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('renders anchor with href', async () => {
		await renderRouter('/');
		const link = screen.getByRole('link', { name: /test link/i });
		expect(link).toHaveAttribute('href', '/test');
	});

	it('handles onClick', async () => {
		await renderRouter('/');
		const onClick = vi.fn();
		render(
			<>
				<Router routes={routes} />
				<Link to="/test" onClick={onClick}>
					Test
				</Link>
			</>
		);
		await act(async () => {
			vi.advanceTimersByTime(2000);
		});
		const link = screen.getByRole('link', { name: /test/i });
		link.click();
		expect(onClick).toHaveBeenCalled();
	});

	it('navigates on click', async () => {
		await renderRouter('/');
		await act(async () => {
			vi.advanceTimersByTime(2000);
		});

		render(
			<>
				<Router routes={routes} />
				<Link to="/about">About</Link>
			</>
		);
		await act(async () => {
			vi.advanceTimersByTime(100);
		});

		const link = screen.getByRole('link', { name: /about/i });
		await act(async () => {
			link.click();
			vi.advanceTimersByTime(2500);
		});
		await waitFor(() => {
			expect(screen.getByText(/About/i)).toBeInTheDocument();
		});
	});
});
