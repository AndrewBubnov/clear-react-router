import { Link } from '../Router/Link.tsx';
import { useParams } from '../Router/hooks/useParams.ts';

export const Post = () => {
	const { postId } = useParams<{ postId: string }>();
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<h3>{`Post ${postId}`}</h3>
			<Link to="/">
				<span>To home page</span>
			</Link>
		</div>
	);
};
