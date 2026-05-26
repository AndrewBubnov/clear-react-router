import { Link } from '../Router/Link.tsx';

export const User = () => {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<h3>User</h3>
			<Link to="/">
				<span>To home page</span>
			</Link>
		</div>
	);
};
