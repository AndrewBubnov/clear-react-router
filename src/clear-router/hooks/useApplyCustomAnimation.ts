import { useEffect } from 'react';

export const useApplyCustomAnimation = (animationDuration?: number) => {
	useEffect(() => {
		if (!animationDuration) return;
		const style = document.createElement('style');
		style.id = 'dynamic-view-transition-duration-style';
		style.textContent = `::view-transition-group(page) { animation-duration: ${animationDuration}ms; }`;
		document.head.appendChild(style);

		return () => style.remove();
	}, [animationDuration]);
};
