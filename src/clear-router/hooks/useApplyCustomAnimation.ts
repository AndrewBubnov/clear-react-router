import { useEffect } from 'react';
import { AnimationOptions } from '../types/global.ts';

export const useApplyCustomAnimation = (animationOptions: AnimationOptions) => {
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
		if (!animationOptions?.duration) return;
		const style = document.createElement('style');
		style.id = 'dynamic-view-transition-duration-style';
		style.textContent = `::view-transition-group(root) { animation-duration: ${animationOptions.duration}ms; }`;
		document.head.appendChild(style);

		return () => style.remove();
	}, [animationOptions]);

	useEffect(() => {
		if (!animationOptions.name) return;
		const style = document.createElement('style');
		style.id = 'dynamic-view-transition-duration-name';
		style.textContent = `
    @keyframes fade-out {
      from { opacity: 1; }
      to { opacity: 0; }
    }    
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slide-left-out {
    from { transform: translateX(0); }
    to { transform: translateX(-100%); }
    }
    @keyframes slide-left-in {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    @keyframes slide-right-out {
    from { transform: translateX(0); }
    to { transform: translateX(100%); }
    }
    @keyframes slide-right-in {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }
	::view-transition-old(root) {
      animation: ${animationOptions.name}-out ${animationOptions.duration ?? 800}ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    ::view-transition-new(root) {
      animation: ${animationOptions.name}-in ${animationOptions.duration ?? 800}ms cubic-bezier(0.4, 0, 0.2, 1);
    }`;
		document.head.appendChild(style);

		return () => style.remove();
	}, [animationOptions]);
};
