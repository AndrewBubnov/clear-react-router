import { Link, useInvalidate, useLoaderState } from '../clear-router';
import { loremIpsum } from 'lorem-ipsum';

const Home = () => {
	const { data } = useLoaderState<string>();
	const invalidate = useInvalidate();
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
			<h3>Home</h3>
			<span>{data}</span>
			<button onClick={() => invalidate('/about', { force: true })}>Invalidate</button>
			<Link to="/about">
				<span>To about page</span>
			</Link>
			<Link to="/user/10">
				<span>To user page</span>
			</Link>
			<main>{loremIpsum({ count: 52, units: 'paragraph' })}</main>
		</div>
	);
};

export default Home;
