import { RenderElement } from '../types';

export const renderElement = (Component?: RenderElement) => {
	if (!Component) return null;
	return typeof Component === 'function' ? <Component /> : Component;
};
