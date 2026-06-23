import { Link, useLoaderState, useLocation, useNavigate, useParams } from '../clear-router';

const Comment = () => {
	const { postId, commentId } = useParams<{ postId: string; commentId: string }>();
	const { state } = useLocation();
	const navigate = useNavigate();
	console.log(useLoaderState());
	return (
		<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
			<h3>{`Comment ${commentId} for post ${postId}`}</h3>
			<div>{JSON.stringify(state)}</div>
			<Link to="/">
				<span>To home page</span>
			</Link>
			<button style={{ flexGrow: 0 }} onClick={() => navigate(-1)}>
				Back
			</button>
		</div>
	);
};

export default Comment;
