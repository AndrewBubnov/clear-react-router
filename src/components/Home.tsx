import { Link } from '../clear-router';
import { loremIpsum } from 'lorem-ipsum';
import { useTypedQuery } from '../clear-router/hooks/useTypedQuery.ts';
import { useEffect } from 'react';
import { integerParser } from '../clear-router/utils/parsers.ts';

const Home = () => {
	const [_, setQuery] = useTypedQuery('amount', integerParser);
	useEffect(() => {
		setQuery(100);
	}, [setQuery]);
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<h3>Home</h3>
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
