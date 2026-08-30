import { useEffect } from 'react';
import { router } from '../instance';
import { isVerticalScroll } from '../utils/utils';
import { WINDOW_LEFT, WINDOW_TOP } from '../constants';

import { ScrollRestorationBehavior } from '../types';

export const usePreserveScroll = (restorationBehavior: ScrollRestorationBehavior) => {
	const {
		routeItem,
		location: { pathname },
	} = router.state.routeItemDataState.getState();
	const scrollMap = router.state.scrollMapState.getState();
	useEffect(() => {
		if (!routeItem || routeItem.scrollRestoration === false || !scrollMap[pathname]) return;
		const behavior = routeItem.scrollRestorationBehavior ?? restorationBehavior;
		scrollMap[pathname].forEach(([key, scrollPosition]) => {
			if (key === WINDOW_TOP || key === WINDOW_LEFT) {
				requestAnimationFrame(() => {
					window.scrollTo({
						[key === WINDOW_TOP ? 'top' : 'left']: scrollPosition,
						behavior,
					});
				});
				return;
			}
			const element = document.getElementById(key);
			if (!element) return;
			const axis = isVerticalScroll(element) ? 'top' : 'left';
			requestAnimationFrame(() => {
				element.scrollTo({ [axis]: scrollPosition, behavior });
			});
		});
	}, [pathname, routeItem?.scrollRestoration, scrollMap]);
};
