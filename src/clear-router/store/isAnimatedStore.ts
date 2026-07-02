import { createStore } from './createStore';

type IsAnimatedStore = { isAnimated: boolean; setIsAnimated(arg: boolean): void };

export const isAnimatedStore = createStore<IsAnimatedStore>(set => ({
	isAnimated: false,
	setIsAnimated: (isAnimated: boolean) => set({ isAnimated }),
}));
