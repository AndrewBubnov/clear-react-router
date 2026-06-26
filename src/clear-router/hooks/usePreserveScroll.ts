import { useEffect, useRef, useState } from 'react';

type UsePreserveScrollParams = {
	pathname: string;
	preserveScroll: boolean;
	nextPathname?: string;
};

export const usePreserveScroll = ({ pathname, preserveScroll, nextPathname }: UsePreserveScrollParams) => {
	const [scrollMap, setScrollMap] = useState<Record<string, number>>({});
	const prevPathname = useRef<string>('');

	useEffect(() => {
		setScrollMap(prevState => {
			const scrollPosition = document.scrollingElement?.scrollTop ?? 0;
			if (!scrollPosition || prevState[prevPathname.current] === scrollPosition) return prevState;
			return { ...prevState, [prevPathname.current]: scrollPosition };
		});
		prevPathname.current = pathname;
	}, [pathname, nextPathname]);

	useEffect(() => {
		if (!preserveScroll || !pathname || !scrollMap[pathname]) return;
		document.scrollingElement?.scrollTo({ top: scrollMap[pathname], behavior: 'smooth' });
	}, [pathname, scrollMap, preserveScroll]);
};
