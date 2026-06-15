import { Link, useLoaderState } from 'clear-react-router';

const Home = () => {
	console.log(useLoaderState());
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<h3>Home</h3>
			<Link to="/about">
				<span>To about page</span>
			</Link>
			<Link to="/user/10">
				<span>To user page</span>
			</Link>
		</div>
	);
};

export default Home;
