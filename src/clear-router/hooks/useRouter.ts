import { useContext } from 'react';
import { InstanceContext } from '../context/InstanceContext.ts';

export const useRouter = () => {
	const context = useContext(InstanceContext);
	if (!context) throw new Error('useRouter must be used within RouterProvider');
	return context;
};
