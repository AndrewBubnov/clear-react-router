import { useSyncExternalStore } from 'react';
import { createRouterInstance } from './creators/createRouterInstance';

export const router = createRouterInstance(useSyncExternalStore);
