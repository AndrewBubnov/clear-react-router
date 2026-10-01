import { useState } from 'react';
import { Link, useBlocker } from '../clear-router';

export const BlockerPage = () => {
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
			{state === 'blocked' && (
				<div className="pg-dialog" role="alertdialog" aria-modal="true" aria-label="Unsaved changes">
					<div className="pg-dialog-box">
						<h2>Leave without saving?</h2>
						<p>You have unsaved changes in the form.</p>
						<div className="pg-row">
							<button className="pg-btn" onClick={process}>
								Leave
							</button>
							<button className="pg-btn" onClick={reset}>
								Stay
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
