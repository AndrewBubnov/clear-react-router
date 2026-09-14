import { createRouter } from '../creators/createRouter.ts';
import { Link } from '../components/Link';
import { useParams } from '../hooks/useParams';
import { loremIpsum } from 'lorem-ipsum';

const sleep = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// eslint-disable-next-line react-refresh/only-export-components
const Home = () => (
	<div>
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

// eslint-disable-next-line react-refresh/only-export-components
const About = () => (
	<div>
		<h3>About</h3>
		<Link to={`/post/10`}>
			<span>To random post page</span>
		</Link>
	</div>
);

// eslint-disable-next-line react-refresh/only-export-components
const Fallback = ({ title }: { title: string }) => <h2>{`Loading ${title}...`}</h2>;

// eslint-disable-next-line react-refresh/only-export-components
const Test = () => {
	return (
		<div>
			<h3>Test</h3>
			<Link to="/">
				<span>To home page</span>
			</Link>
		</div>
	);
};

// eslint-disable-next-line react-refresh/only-export-components
const User = () => {
	const { userId } = useParams<{ userId: string }>();
	return (
		<div>
			<h3>User {userId}</h3>
		</div>
	);
};

// eslint-disable-next-line react-refresh/only-export-components
const UserList = () => (
	<div>
		<h3>User List</h3>
	</div>
);

// eslint-disable-next-line react-refresh/only-export-components
const NotFound = () => (
	<div>
		<h1>404</h1>
		<h3>Not Found</h3>
	</div>
);

export const routes = createRouter([
	{
		path: '/',
		element: Home,
		loader: async () => {
			await sleep(1500);
			return `Hello from home, ${new Date().getSeconds()}`;
		},
	},
	{
		path: '/about',
		element: About,
		loader: async () => {
			await sleep(2000);
			return `About page: , ${new Date().getSeconds()}`;
		},
		staleTime: 1000,
		loaderFallback: <Fallback title="About" />,
	},
	{ path: '/test', element: Test },
	{
		path: '/user',
		element: UserList,
		children: [
			{
				path: '/:userId',
				element: User,
			},
		],
	},
	{ path: '*', element: NotFound },
]);
