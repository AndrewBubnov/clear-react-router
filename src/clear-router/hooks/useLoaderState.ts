import { router } from '../instance';
import { LoaderState } from '../types';

export const useLoaderState = <T>() => router.state.loaderStateRef.value as LoaderState<T>;
