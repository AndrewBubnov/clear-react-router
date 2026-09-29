import { Link } from '../clear-router';

const demos = [
	{ to: '/playground/scroll', title: 'Scroll restoration', text: 'Window + named scroll containers (#feed, #gallery), smooth behavior. Scroll, leave, come back.' },
	{ to: '/playground/retry', title: 'Retry', text: 'Flaky loader (fails ~50%) with automatic retry + attempt counter. Compare with the no-retry route.' },
	{ to: '/playground/live', title: 'Polling', text: 'Live quotes revalidated every 2s while the route is active. Leave and polling stops.' },
	{ to: '/playground/actions', title: 'Actions + invalidation', text: 'Submit a form via useSubmitAction, list refreshes automatically. Manual refresh via invalidate().' },
	{ to: '/playground/blocker', title: 'Navigation blocking', text: 'Dirty form + useBlocker dialog. Try links and the browser Back button.' },
];

export const PlaygroundHome = () => (
	<div className="pg-wrap">
		<h1>Clear Router Playground</h1>
		<p>
			Live demo of data loading, cache and navigation features. Every page below is a
			working route — open devtools network tab and click around.
		</p>
		<div className="pg-home-grid">
			{demos.map(d => (
				<div className="pg-card" key={d.to}>
					<h2>{d.title}</h2>
					<p>{d.text}</p>
					<p>
						<Link to={d.to}>Open →</Link>
					</p>
				</div>
			))}
		</div>
	</div>
);
