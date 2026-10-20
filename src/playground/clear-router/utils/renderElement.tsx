import type { ComponentType, ReactElement } from 'react';
import type { RenderElement } from '../types';

export const renderElement = (Component?: RenderElement): ReactElement | null => {
	if (!Component) return null;
	if (typeof Component !== 'function') return Component as ReactElement;
	const C = Component as ComponentType;
	return <C />;
};
