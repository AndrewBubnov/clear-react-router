import { Link } from '../clear-router';

export const UserList = () => {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<h3>User list</h3>
			<Link to="/">
				<span>To home page</span>
			</Link>
		</div>
	);
};
