import { Link, useQueryParam, parser } from '../clear-router';
import { loremIpsum } from 'lorem-ipsum';

const Home = () => {
	const [value, setValue] = useQueryParam('filter', parser.string, '');
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<h3>Home</h3>
			<input value={value} onChange={e => setValue(e.target.value)} placeholder="Search" />
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
