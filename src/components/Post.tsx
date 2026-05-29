import { Link } from '../Router/Link.tsx';
import { useParams } from '../Router/hooks/useParams.ts';
import { useNavigate } from '../Router/hooks/useNavigate.ts';
import { useLocation } from '../Router/hooks/useLocation.ts';
import { useState } from 'react';
import { useBlocker } from '../Router/hooks/useBlocker.ts';

const randomId = Math.ceil(Math.random() * 100 + 1);

export const Post = () => {
	const [text, setText] = useState('');
	const [post, setPost] = useState('');
	const { postId } = useParams<{ postId: string }>();
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const { state, process, reset } = useBlocker(() => Boolean(text.length));

	return (
		<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '0 100px' }}>
			{state === 'blocked' ? (
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						gap: 20,
						padding: '0 200px',
					}}
				>
					<h3>You have unsaved changes, are you going to loose them?</h3>
					<div style={{ display: 'flex', justifyContent: 'space-between' }}></div>
					<button onClick={process}>Leave page</button>
					<button onClick={reset}>Stay on page</button>
				</div>
			) : (
				<>
					<h3>{`Post ${postId}`}</h3>
					<input type="text" value={text} onChange={e => setText(e.target.value)} />
					<button
						onClick={() => {
							setPost(text);
							setText('');
						}}
						style={{ width: 'fit-content' }}
					>
						Save post
					</button>
					{post}
					<Link to="/">
						<span>To home page</span>
					</Link>
					<div
						onClick={() =>
							navigate({ pathname: `${pathname}/comment/${randomId}`, state: { commentId: randomId } })
						}
						style={{ cursor: 'pointer' }}
					>{`To comment ${randomId}`}</div>
				</>
			)}
		</div>
	);
};
