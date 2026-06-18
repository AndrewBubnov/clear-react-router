import { type ReactNode } from 'react';
import { RouterViewContext } from '../context/RouterViewContext.ts';

type ViewProviderProps = { params: Record<string, string>; children: ReactNode };

export const ViewProvider = ({ children, params }: ViewProviderProps) => {
	return <RouterViewContext.Provider value={params}>{children}</RouterViewContext.Provider>;
};
