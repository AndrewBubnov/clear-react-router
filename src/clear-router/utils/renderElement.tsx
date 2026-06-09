import { type ReactElement } from 'react';

export const renderElement = (Component?: (() => ReactElement) | ReactElement) => {
	if (!Component) return null;
	return typeof Component === 'function' ? <Component /> : Component;
};
