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
			<ul className="pg-hint pg-hint-list">
				<li>
					Type something — the blocker becomes <code>charged</code>.
				</li>
				<li>
					Follow the link (or press browser Back) — the state turns <code>blocked</code> and the dialog opens.
				</li>
				<li>
					Choose <strong>Leave</strong> to navigate anyway, or <strong>Stay</strong> to keep editing.
				</li>
			</ul>
			<div className="pg-card">
				<div className="pg-row">
					<input
						className="pg-input"
						placeholder="Type to make the form dirty…"
						aria-label="Unsaved form text"
						value={value}
						onChange={e => setValue(e.target.value)}
					/>
					<span className="pg-badge" role="status">
						blocker: {state}
					</span>
				</div>
				<p>
					<Link to="/playground">← Try leaving via this link</Link>
				</p>
			</div>
			<Modal opened={state === 'blocked'} onClose={reset} title="Leave without saving?" centered>
				<p>You have unsaved changes in the form.</p>
				<div className="pg-row">
					<Button variant="light" onClick={process} size="xs">
						Leave
					</Button>
					<Button variant="light" onClick={reset} size="xs">
						Stay
					</Button>
				</div>
			</Modal>
		</div>
	);
};
export default BlockerPage;
