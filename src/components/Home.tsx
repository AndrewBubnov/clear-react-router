import { Link } from '../Router/Link.tsx';
import { useLoaderState } from '../Router/hooks/useLoaderState.ts';

export const Home = () => {
	// console.log(useLoaderState());
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<h3>Home</h3>
			<Link to="/about">
				<span>To about page</span>
			</Link>
		</div>
	);
};
