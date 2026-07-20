import { useRouter } from './useRouter';
import { LoaderState } from '../types/global';

export const useLoaderState = <T>() => {
	const router = useRouter();
	const [loaderState] = router.hooks.useCurrentLoaderState();

	return loaderState as LoaderState<T>;
};
