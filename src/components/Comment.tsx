import { Link } from '../Router/Link.tsx';

export const Comment = () => {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<h3>Comment</h3>
			<Link to="/">
				<span>To home page</span>
			</Link>
		</div>
	);
};
