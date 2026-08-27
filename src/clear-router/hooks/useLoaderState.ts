import { router } from '../instance';
import { LoaderState } from '../types';

export const useLoaderState = <T>() => router.state.loaderState.getState() as LoaderState<T>;
