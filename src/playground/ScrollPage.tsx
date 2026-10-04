import { Link, useRestoreScroll } from '../clear-router';

const feedRows = Array.from({ length: 60 }, (_, i) => `Feed row ${i + 1}`);
const galleryCards = Array.from({ length: 30 }, (_, i) => `Card ${i + 1}`);

const ManualRestore = () => {
	const restoreScroll = useRestoreScroll();
	return (
		<button className="pg-btn" onClick={() => restoreScroll()}>
			Restore saved positions
		</button>
	);
};

const ScrollPage = () => (
	<div className="pg-wrap pg-wrapper">
		<h1>Scroll restoration</h1>
		<p className="pg-hint">
			Scroll the feed and the gallery below, then go <Link to="/playground">home</Link> and come back (or use the
			browser Back button). Both containers restore their positions with optional smooth scrolling.
		</p>
		<p>
			<Link to="/playground">← Back to playground home</Link>
		</p>
		<h2>Feed (vertical, id=&quot;feed&quot;)</h2>
		<div id="feed" className="pg-feed">
			{feedRows.map(row => (
				<div key={row}>{row} — lorem ipsum dolor sit amet</div>
			))}
		</div>
		<h2>Gallery (horizontal, id=&quot;gallery&quot;)</h2>
		<div id="gallery" className="pg-gallery">
			{galleryCards.map(card => (
				<span key={card} className="pg-card-item">
					{card}
				</span>
			))}
		</div>
		<div className="pg-row">
			<ManualRestore />
		</div>
		<p className="pg-hint">
			Automatic restoration runs on mount — but if the content isn&apos;t ready yet (async data, images), saved
			positions may land off. The button above re-applies them on demand: scroll somewhere else without leaving
			the page, then press it.
		</p>
	</div>
);

export default ScrollPage;
