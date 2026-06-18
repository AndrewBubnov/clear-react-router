import { Link, useNavigate } from '../clear-router';

export const Navbar = () => {
	const navigate = useNavigate();
	return (
		<nav style={{ display: 'flex', gap: 100, position: 'fixed', top: 16, right: 16 }}>
			<Link to="/">
				<span>Home</span>
			</Link>
			<button onClick={() => navigate('/')}>Home</button>
			<button onClick={() => navigate('/about')}>About</button>
			<button onClick={() => navigate('/user')}>User list</button>
		</nav>
	);
};
