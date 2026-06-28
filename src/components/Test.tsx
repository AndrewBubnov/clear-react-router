import { Link } from 'clear-react-router';

export const Test = () => {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<h3>Test</h3>
			<Link to="/">
				<span>To home page</span>
			</Link>
		</div>
	);
};
