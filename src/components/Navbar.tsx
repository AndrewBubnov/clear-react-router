import { useNavigate } from '../clear-router';

export const Navbar = () => {
	const navigate = useNavigate();
	return (
		<nav style={{ display: 'flex', gap: 100 }}>
			<button onClick={() => navigate('/')}>Home</button>
			<button onClick={() => navigate('/about')}>About</button>
			<button onClick={() => navigate('/user')}>User list</button>
		</nav>
	);
};
