import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Router, Link, createRouter, useLocation, useRestoreScroll } from '../..';

const TEST_TIMEOUT = 10000;

let restoreByPath: Record<string, (() => void) | undefined> = {};

const Probe = () => {
	const { pathname } = useLocation();
	const restore = useRestoreScroll();
	useEffect(() => {
		restoreByPath[pathname] = restore;
	}, [pathname, restore]);
	return null;
};

const mockWindowScroll = (top: number, left = 0) => {
	Object.defineProperty(document, 'scrollingElement', {
		value: { scrollTop: top, scrollLeft: left },
		configurable: true,
	});
};

const restoreWindowScroll = () => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	delete (document as any).scrollingElement;
};

const routes = createRouter([
	{
		path: '/',
		element: (
			<div>
				<h3>Home</h3>
				<Probe />
				<Link to="/other">
					<span>To other</span>
				</Link>
				<Link to="/panel">
					<span>To panel</span>
				</Link>
				<Link to="/optout">
					<span>To optout</span>
				</Link>
			</div>
		),
	},
	{
		path: '/other',
		element: (
			<div>
				<h3>Other</h3>
				<Probe />
				<Link to="/">
					<span>To home</span>
				</Link>
			</div>
		),
	},
	{
		path: '/panel',
		element: (
			<div>
				<h3>Panel</h3>
				<Probe />
				<div id="panel" style={{ height: '100px', overflow: 'auto' }} />
				<Link to="/">
					<span>To home</span>
				</Link>
			</div>
		),
		scrollRestoration: ['panel'],
	},
	{
		path: '/optout',
		element: (
			<div>
				<h3>Optout</h3>
				<Probe />
				<Link to="/">
					<span>To home</span>
				</Link>
			</div>
		),
		scrollRestoration: false,
	},
	{ path: '*', element: <div>Not Found</div> },
]);

const renderAtHome = async () => {
	render(<Router routes={routes} />);
	await waitFor(
		() => {
			expect(screen.getByText('Home')).toBeInTheDocument();
		},
		{ timeout: 5000 }
	);
};

describe('useRestoreScroll hook', () => {
	beforeEach(() => {
		window.history.pushState({}, '', '/');
		restoreByPath = {};
		// Safety net: jsdom has no Element.scrollTo, and the automatic restore
		// calls it on freshly mounted (unmocked) elements.
		window.HTMLElement.prototype.scrollTo = vi.fn();
	});

	afterEach(() => {
		restoreWindowScroll();
	});

	it(
		'restores saved window scroll on manual call',
		async () => {
			mockWindowScroll(150);
			await renderAtHome();

			expect(typeof restoreByPath['/']).toBe('function');

			screen.getByRole('link', { name: /to other/i }).click();
			await waitFor(
				() => {
					expect(screen.getByText('Other')).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);

			screen.getByRole('link', { name: /to home/i }).click();
			await waitFor(
				() => {
					expect(screen.getByText('Home')).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);

			vi.mocked(window.scrollTo).mockClear();
			restoreByPath['/']?.();
			await waitFor(
				() => {
					expect(window.scrollTo).toHaveBeenCalledWith({ top: 150, behavior: 'auto' });
				},
				{ timeout: 5000 }
			);
		},
		TEST_TIMEOUT
	);

	it(
		'reads fresh map data on every call, not the first snapshot',
		async () => {
			mockWindowScroll(300);
			await renderAtHome();

			screen.getByRole('link', { name: /to other/i }).click();
			await waitFor(
				() => {
					expect(screen.getByText('Other')).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);

			screen.getByRole('link', { name: /to home/i }).click();
			await waitFor(
				() => {
					expect(screen.getByText('Home')).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);

			vi.mocked(window.scrollTo).mockClear();
			restoreByPath['/']?.();
			await waitFor(
				() => {
					expect(window.scrollTo).toHaveBeenCalledWith({ top: 300, behavior: 'auto' });
				},
				{ timeout: 5000 }
			);
		},
		TEST_TIMEOUT
	);

	it(
		'restores element scroll on manual call',
		async () => {
			await renderAtHome();

			const setupPanel = () => {
				const panel = document.getElementById('panel') as HTMLElement;
				Object.defineProperty(panel, 'scrollHeight', { value: 200, configurable: true });
				Object.defineProperty(panel, 'clientHeight', { value: 100, configurable: true });
				panel.scrollTop = 90;
				panel.scrollTo = vi.fn();
				return panel;
			};

			screen.getByRole('link', { name: /to panel/i }).click();
			await waitFor(
				() => {
					expect(document.getElementById('panel')).not.toBeNull();
				},
				{ timeout: 5000 }
			);
			const savedPanel = setupPanel();

			screen.getByRole('link', { name: /to home/i }).click();
			await waitFor(
				() => {
					expect(screen.getByText('Home')).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);
			expect(savedPanel.scrollTo).not.toHaveBeenCalled();

			screen.getByRole('link', { name: /to panel/i }).click();
			await waitFor(
				() => {
					expect(document.getElementById('panel')).not.toBeNull();
				},
				{ timeout: 5000 }
			);
			const restoredPanel = setupPanel();
			(restoredPanel.scrollTo as ReturnType<typeof vi.fn>).mockClear();

			restoreByPath['/panel']?.();
			await waitFor(
				() => {
					expect(restoredPanel.scrollTo).toHaveBeenCalledWith({ top: 90, behavior: 'auto' });
				},
				{ timeout: 5000 }
			);
		},
		TEST_TIMEOUT
	);

	it(
		'does nothing for routes opted out with scrollRestoration: false',
		async () => {
			mockWindowScroll(150);
			await renderAtHome();

			screen.getByRole('link', { name: /to optout/i }).click();
			await waitFor(
				() => {
					expect(screen.getByText('Optout')).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);

			screen.getByRole('link', { name: /to home/i }).click();
			await waitFor(
				() => {
					expect(screen.getByText('Home')).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);

			// An entry for /optout was saved on leave; returning must skip
			// both the automatic restore and a manual call on that route.
			vi.mocked(window.scrollTo).mockClear();
			screen.getByRole('link', { name: /to optout/i }).click();
			await waitFor(
				() => {
					expect(screen.getByText('Optout')).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);
			await new Promise(resolve => setTimeout(resolve, 100));
			expect(window.scrollTo).not.toHaveBeenCalled();

			restoreByPath['/optout']?.();
			await new Promise(resolve => setTimeout(resolve, 100));
			expect(window.scrollTo).not.toHaveBeenCalled();
		},
		TEST_TIMEOUT
	);
});
