import { useEffect } from 'react';

export const useApplyCustomAnimation = (animationDuration?: number) => {
	useEffect(() => {
		const style = document.createElement('style');
		style.id = 'spinner-style';
		style.textContent = `
	@keyframes cr-spin {
	  0% { transform: rotate(0deg); }
	  100% { transform: rotate(360deg); }
	}
	
	.cr-spinner {
	  position: fixed;
	  top: 5px;
	  left: 5px;
	  z-index: 9999;
	  width: 1rem;
	  height: 1rem;
	  border: 2px solid gray;
	  border-bottom-color: transparent;
	  border-radius: 50%;
	  animation: cr-spin 1s linear infinite;
	}
	`;
		document.head.appendChild(style);

		return () => style.remove();
	}, []);

	useEffect(() => {
		if (!animationDuration) return;
		const style = document.createElement('style');
		style.id = 'dynamic-view-transition-duration-style';
		style.textContent = `::view-transition-group(page) { animation-duration: ${animationDuration}ms; }`;
		document.head.appendChild(style);

		return () => style.remove();
	}, [animationDuration]);
};
