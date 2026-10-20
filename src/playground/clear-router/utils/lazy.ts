import { ComponentType } from 'react';
import { LAZY_MARKER, LazyComponent } from '../types';

export const lazy = (importFn: () => Promise<{ default: ComponentType<unknown> }>): LazyComponent => ({
	[LAZY_MARKER]: true,
	importFn,
});
