import { useEffect, useState } from 'react';

type UsePreserveScrollParams = {
	pathname: string;
	preserveScroll: boolean;
};

export const usePreserveScroll = ({ pathname, preserveScroll }: UsePreserveScrollParams) => {
	const [scrollMap, setScrollMap] = useState<Record<string, number>>({});

	useEffect(() => {
		if (!preserveScroll || !pathname || !scrollMap[pathname]) return;
		document.scrollingElement?.scrollTo({ top: scrollMap[pathname] });
	}, [pathname, scrollMap, preserveScroll]);

	return setScrollMap;
};
