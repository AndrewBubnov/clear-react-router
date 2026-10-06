import { Link, useNavigate, useParams, type LinkProps } from '../..';

type AppPaths = '/playground/cache' | '/playground/product/:productId' | '/playground/nest/:nestId/item/:itemId';

export const ValidLinks = () => (
	<>
		<Link to="/anything/at/all" />
		<Link path="/playground/product/:productId" params={{ productId: '7' }} />
		<Link path="/playground/product/:productId" params={{ productId: 7 }} />
		<Link path="/playground/cache" />
	</>
);

export const AppLink = <T extends HTMLElement = HTMLAnchorElement>(props: LinkProps<T, AppPaths>) => (
	<Link {...props} />
);

export const StrictLinks = () => (
	<>
		<AppLink path="/playground/cache" />
		<AppLink path="/playground/product/:productId" params={{ productId: '7' }} />
	</>
);

// @ts-expect-error — unknown path
export const BadPath = () => <AppLink path="/playgroud/cache" />;

// @ts-expect-error — missing params
export const MissingParams = () => <AppLink path="/playground/product/:productId" />;

// @ts-expect-error — wrong param name
export const WrongParam = () => <AppLink path="/playground/product/:productId" params={{ id: '7' }} />;

// @ts-expect-error — params on a segment-less path
export const ExtraParams = () => <AppLink path="/playground/cache" params={{ tab: 'info' }} />;

// @ts-expect-error — missing params, inferred from the literal itself without any union
export const InferredMissingParams = () => <Link path="/playground/product/:productId" />;

export const ParamsHook = () => {
	const { productId } = useParams<'/playground/product/:productId'>();
	const id: string = productId;
	return <>{id}</>;
};

export const LegacyParamsHook = () => {
	const { productId } = useParams<{ productId: string }>();
	return <>{productId}</>;
};

export const NavigateProbe = () => {
	const navigate = useNavigate();
	return (
		<button
			onClick={() => {
				void navigate({ path: '/playground/product/:productId', params: { productId: '7' } });
				void navigate('/plain/string');
			}}
		>
			go
		</button>
	);
};

export const BadNavigate = () => {
	const navigate = useNavigate();
	// @ts-expect-error — missing params in navigate
	return <button onClick={() => navigate({ path: '/playground/product/:productId' })}>go</button>;
};
