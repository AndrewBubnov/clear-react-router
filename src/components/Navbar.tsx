import { Link } from '../clear-router';

export const Navbar = () => (
	<nav style={{ display: 'flex', gap: 100, position: 'fixed', top: 16, right: 16, zIndex: 999 }}>
		<Link to="/">Home</Link>
		<Link to="/about">About</Link>
		<Link to="/user">User list</Link>
	</nav>
);
