import { router } from '../instance';

export const useParams = <T>() => router.hooks.useParams<T>();
