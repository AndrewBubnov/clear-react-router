import { Link } from '../clear-router';

export const NotFound = () => {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<h1>404</h1>
			<h3>Page not found</h3>
			<Link to="/">
				<button>To home page</button>
			</Link>
		</div>
	);
};
