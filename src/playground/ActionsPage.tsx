import { useState } from 'react';
import { Link, useInvalidate, useLoaderState, useSubmitAction } from '../clear-router';
import type { Note } from './api';

const AddNoteForm = () => {
	const invalidate = useInvalidate();
	const { onSubmit, isSubmitting, error } = useSubmitAction('addNote');
	const [isRevalidating, setIsRevalidating] = useState(false);
	const refresh = async () => {
		setIsRevalidating(true);
		try {
			await invalidate();
		} finally {
			setIsRevalidating(false);
		}
	};

	return (
		<div className="pg-card">
			<h2>Add a note (route action)</h2>
			<form onSubmit={onSubmit}>
				<div className="pg-row">
					<input name="text" className="pg-input" placeholder="Note text" disabled={isSubmitting} />
					<div className="pg-row">
						<button className="pg-btn" disabled={isSubmitting}>
							{isSubmitting ? 'Saving…' : 'Save'}
						</button>
						<button type="button" className="pg-btn" disabled={isRevalidating} onClick={refresh}>
							{isRevalidating ? 'Refreshing…' : 'Refresh list (invalidate)'}
						</button>
					</div>
				</div>
			</form>
			{error && <div className="pg-error">{error.message}</div>}
			<p className="pg-hint">
				After a successful action the current route is invalidated automatically — the list below refreshes
				without a full reload. The Refresh button calls <code>invalidate()</code> manually and does the same on
				demand. Invalidation is a background revalidation: no loading fallback appears, the list simply swaps
				once fresh data arrives.
			</p>
		</div>
	);
};

const ActionsPage = () => {
	const { data: notes } = useLoaderState<Note[]>();
	return (
		<div className="pg-wrap">
			<h1>Actions + invalidation</h1>
			<AddNoteForm />
			<div className="pg-card">
				<h2>Notes ({notes.length})</h2>
				<ul className="pg-list">
					{notes.map(note => (
						<li key={note.id}>
							#{note.id} — {note.text}
						</li>
					))}
				</ul>
			</div>
			<p>
				<Link to="/playground">← Back to playground home</Link>
			</p>
		</div>
	);
};

export default ActionsPage;
