import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from '../../components/Spinner';

describe('Spinner', () => {
	it('exposes a status role for assistive technology', () => {
		render(<Spinner />);
		expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
	});
});
