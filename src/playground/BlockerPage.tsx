import { useState } from 'react';
import { Modal, Button } from '@mantine/core';
import { Link, useBlocker } from '../clear-router';

const BlockerPage = () => {
	const [value, setValue] = useState('');
	const dirty = !!value.length;
	const { state, process, reset } = useBlocker(() => dirty);

	return (
		<div className="pg-wrap">
			<h1>Navigation blocking</h1>
			<p className="pg-hint">
				Type something to make the form dirty — navigation (links <em>and</em> the browser Back button) gets
				intercepted until you confirm or cancel.
			</p>
			<div className="pg-card">
				<div className="pg-row">
					<input
						className="pg-input"
						placeholder="Type to make the form dirty…"
						value={value}
						onChange={e => setValue(e.target.value)}
					/>
					<span className="pg-badge">blocker: {state}</span>
				</div>
				<p>
					<Link to="/playground">← Try leaving via this link</Link>
				</p>
			</div>
			<Modal opened={state === 'blocked'} onClose={reset} title="Leave without saving?" centered>
				<p>You have unsaved changes in the form.</p>
				<div className="pg-row">
					<Button variant="light" onClick={process}>
						Leave
					</Button>
					<Button variant="light" onClick={reset}>
						Stay
					</Button>
				</div>
			</Modal>
		</div>
	);
};
export default BlockerPage;
