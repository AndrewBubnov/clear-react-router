import { Link } from '../Router/Link.tsx';

export const About = () => {
	// eslint-disable-next-line react-hooks/purity
	const id = Math.ceil(Math.random() * 100 + 1);

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<h3>About</h3>
			<Link to={`/post/${id}`}>
				<span>To random post page</span>
			</Link>
		</div>
	);
};
