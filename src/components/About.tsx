import { Link } from '../Router';

const id = Math.ceil(Math.random() * 100 + 1);

export const About = () => {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<h3>About</h3>
			<Link to={`/post/${id}`}>
				<span>To random post page</span>
			</Link>
		</div>
	);
};
