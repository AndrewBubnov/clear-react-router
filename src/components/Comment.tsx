import { Link } from '../Router/Link.tsx';
import { useParams } from '../Router/hooks/useParams.ts';
import { useLocation } from '../Router/hooks/useLocation.ts';

export const Comment = () => {
	const { postId, commentId } = useParams<{ postId: string; commentId: string }>();
	const { state } = useLocation();

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<h3>{`Comment ${commentId} for post ${postId}`}</h3>
			<div>{JSON.stringify(state)}</div>
			<Link to="/">
				<span>To home page</span>
			</Link>
		</div>
	);
};
