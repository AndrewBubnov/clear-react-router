import { Link, useLocation } from '../Router';

export const ErrorComponent = () => {
	console.log(useLocation());
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<h3>Something went wrong</h3>
			<Link to="/">
				<button>To home page</button>
			</Link>
		</div>
	);
};
