import { useState } from 'react';
import { Alert, Button } from '@mantine/core';
import { Link, useInvalidate, useLoaderState, useSubmitAction } from '../clear-router';
import { getCallCount, type Note } from './api';

const AddNoteForm = () => {
	const invalidate = useInvalidate();
	const { onSubmit, isSubmitting, error } = useSubmitAction('addNote');
	const [isRevalidating, setIsRevalidating] = useState(false);
	const isBusy = isSubmitting || isRevalidating;
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
					<input
						name="text"
						className="pg-input"
						placeholder="Note text"
						aria-label="Note text"
						disabled={isSubmitting}
					/>
					<div className="pg-row">
						<Button variant="light" type="submit" disabled={isBusy} size="xs">
							{isSubmitting ? 'Saving…' : 'Save'}
						</Button>
						<Button variant="light" type="button" disabled={isBusy} onClick={refresh} size="xs">
							{isRevalidating ? 'Refreshing…' : 'Refresh list (invalidate)'}
						</Button>
					</div>
				</div>
			</form>
			{error && <Alert color="red">{error.message}</Alert>}
			<p className="pg-hint">
				After a successful action the current route is invalidated automatically — the list below refreshes
				without a full reload. The Refresh button calls <code>invalidate()</code> manually and does the same on
				demand. Invalidation is a background revalidation: no loading fallback appears, the list simply swaps
				once fresh data arrives. Watch <code>loader calls</code> tick when it runs.
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
				<h2 aria-live="polite">Notes ({notes.length})</h2>
				<p>
					<span className="pg-badge">loader calls: {getCallCount('notes')}</span>
				</p>
				{notes.length === 0 ? (
					<p className="pg-hint">No notes yet — add one above.</p>
				) : (
					<ul className="pg-list">
						{notes.map(note => (
							<li key={note.id}>
								#{note.id} — {note.text}
							</li>
						))}
					</ul>
				)}
			</div>
			<p>
				<Link to="/playground">← Back to playground home</Link>
			</p>
		</div>
	);
};

export default ActionsPage;
