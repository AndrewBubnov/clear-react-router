import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useNavigate } from '../hooks/useNavigate';
import { Router } from '../components/Router.tsx';

const Home = () => {
	const navigate = useNavigate();
	return <button onClick={() => navigate({ pathname: '/about' })}>Go to About</button>;
};

const About = () => <div>About Page</div>;

describe('useNavigate', () => {
	beforeEach(() => {
		window.history.pushState({}, '', '/');
	});

	it('navigates to a new route and renders component', async () => {
		const user = userEvent.setup();

		render(
			<Router
				routeList={[
					{ path: '/', element: <Home /> },
					{ path: '/about', element: <About /> },
				]}
			/>
		);

		expect(screen.getByText('Go to About')).toBeInTheDocument();

		await user.click(screen.getByText('Go to About'));

		expect(screen.getByText('About Page')).toBeInTheDocument();
	});
});
