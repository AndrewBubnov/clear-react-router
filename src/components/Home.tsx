import { Link, parser } from '../clear-router';
import { loremIpsum } from 'lorem-ipsum';
import { useTypedQuery } from '../clear-router/hooks/useTypedQuery.ts';
import { z } from 'zod';
import { useEffect } from 'react';

const schema = z.object({ name: z.string() });

const Home = () => {
	const [query, setQuery] = useTypedQuery('filter', parser.string, '');
	useEffect(() => {
		setQuery('Andrew');
	}, []);

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<h3>Home</h3>
			<input value={query} onChange={e => setQuery(e.target.value)} />
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
