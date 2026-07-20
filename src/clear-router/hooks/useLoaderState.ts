import { useCurrentLoaderState } from '../state/hooks.ts';
import { LoaderState } from '../types/global';
import { useRouter } from './useRouter.ts';

export const useLoaderState = <T>() => {
	const router = useRouter();
	const [loaderState] = useCurrentLoaderState(router);

	return loaderState as LoaderState<T>;
};
