import { Link } from '../Router/Link.tsx';

export const About = () => {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<h3>About</h3>
			<Link to="/test">
				<span>To test page</span>
			</Link>
		</div>
	);
};
