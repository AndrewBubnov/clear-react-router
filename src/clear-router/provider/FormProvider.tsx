import { PropsWithChildren } from 'react';
import { FormContext, FormContextProps } from '../context/FormContext';

export const FormProvider = ({ children, isSubmitting }: PropsWithChildren<FormContextProps>) => (
	<FormContext.Provider value={{ isSubmitting }}>{children}</FormContext.Provider>
);
