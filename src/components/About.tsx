import { Link, useLoaderState } from 'clear-react-router';

const id = Math.ceil(Math.random() * 100 + 1);

const About = () => {
	console.log(useLoaderState());
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<h3>About</h3>
			<Link to={`/post/${id}`}>
				<span>To random post page</span>
			</Link>
		</div>
	);
};

export default About;
