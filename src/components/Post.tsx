import { Link } from '../Router/Link.tsx';
import { useParams } from '../Router/hooks/useParams.ts';
import { useNavigate } from '../Router/hooks/useNavigate.ts';
import { useLocation } from '../Router/hooks/useLocation.ts';

export const Post = () => {
	const { postId } = useParams<{ postId: string }>();
	const navigate = useNavigate();
	const { pathname } = useLocation();
	// eslint-disable-next-line react-hooks/purity
	const id = Math.ceil(Math.random() * 100 + 1);
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<h3>{`Post ${postId}`}</h3>
			<Link to="/">
				<span>To home page</span>
			</Link>
			<div
				onClick={() => navigate({ pathname: `${pathname}/comment/${id}` })}
				style={{ cursor: 'pointer' }}
			>{`To comment ${id}`}</div>
		</div>
	);
};
