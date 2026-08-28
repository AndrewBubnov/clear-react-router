import { Link, useParams } from '../clear-router';

export const User = () => {
	const { userId } = useParams<{ userId: string }>();
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<h3>{`User ${userId}`}</h3>
			<Link to="/">
				<span>To home page</span>
			</Link>
		</div>
	);
};
