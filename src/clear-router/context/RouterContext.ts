import { createContext } from 'react';
import { RouterType } from '../types/global';

export const RouterContext = createContext<RouterType>({} as RouterType);
