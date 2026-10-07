import { router } from '../instance';
import type { ParamsFor } from '../types';

/**
 * Route params of the current location.
 *
 * - `useParams()` — plain record, convenient but key typos are NOT caught.
 * - `useParams<'/post/:postId'>()` — infers `{ postId: string }` from the pattern; typos are compile errors.
 * - `useParams<{ ... }>()` — legacy manual shape, kept for compatibility.
 */
export const useParams = <T = Record<string, string>>(): T extends string ? ParamsFor<T> : T =>
	router.hooks.useParams() as T extends string ? ParamsFor<T> : T;
