import { useRouter } from './useRouter';

export const useRouterContext = () => {
	const router = useRouter();
	const [context, setContext] = router.hooks.useContextState();

	return { context, setContext };
};
