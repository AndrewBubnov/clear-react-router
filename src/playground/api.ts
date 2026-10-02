// Fake in-browser "server" for the playground. No backend: latency, random
// failures and changing data are simulated here so every router feature can
// be tried live (retry, polling, invalidation, actions).

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

type Quote = { symbol: string; price: number };

const PRICES: Record<string, number> = {
	CLR: 42.5,
	VITE: 18.2,
	REACT: 310.4,
};

let tick = 0;
const loaderCalls: Record<string, number> = {};

export const getCallCount = (key: string) => loaderCalls[key] ?? 0;

export const resetCallCounts = () => {
	Object.keys(loaderCalls).forEach(key => {
		delete loaderCalls[key];
	});
};

const trackCall = (key: string) => {
	loaderCalls[key] = (loaderCalls[key] ?? 0) + 1;
	return loaderCalls[key];
};

/** Fails randomly (~50%) after a short delay. Powers the retry demo. */
export const fetchUnstable = async () => {
	const attempt = trackCall('about');
	await delay(400);
	if (Math.random() < 0.5) {
		throw new Error(`Random server hiccup on attempt ${attempt} — retry should kick in`);
	}
	return { value: `Lucky payload (attempt ${attempt})`, attempt };
};

/** Always-failing twin for the errorElement demo (no retry configured). */
export const fetchDoomed = async () => {
	trackCall('about');
	await delay(400);
	throw new Error('Server is having a bad day (no retry on this route)');
};

/** Slow loader for the prefetch demo. */
export const fetchSlow = async () => {
	const n = trackCall('slow');
	await delay(800);
	return `Slow payload (call ${n})`;
};

/** Incrementing value for the optimistic demo (slow on purpose so revalidation is visible). */
export const fetchOptimisticValue = async () => {
	const generation = trackCall('optimistic');
	await delay(1200);
	return { value: 100 + generation, generation };
};

/** Random-walking quotes. Powers the polling demo. */
export const fetchQuotes = async (): Promise<{ tick: number; quotes: Quote[] }> => {
	trackCall('live');
	await delay(200);
	tick += 1;
	const quotes = Object.entries(PRICES).map(([symbol, base]) => {
		const drift = (Math.random() - 0.5) * base * 0.04;
		PRICES[symbol] = Math.round((base + drift) * 100) / 100;
		return { symbol, price: PRICES[symbol] };
	});
	return { tick, quotes };
};

/** Per-product loader for the cache eviction demo. */
export const fetchProduct = async (id: string) => {
	const n = trackCall(`product-${id}`);
	await delay(400);
	return { id, description: `Product ${id} (loaded ${n} time${n === 1 ? '' : 's'})`, loads: n };
};

/** Payload for the cache lab home page itself. Revisit renders instantly from cache. */
export const fetchCachePayload = async () => {
	const n = trackCall('cache');
	await delay(600);
	return `Cache lab payload (call ${n})`;
};

/** Nest demo: per-id payload with visible latency, cached separately per params. */
export const fetchNest = async (nestId: string) => {
	const n = trackCall(`nest-${nestId}`);
	await delay(500);
	return { nestId, description: `Nest ${nestId} (loaded ${n} time${n === 1 ? '' : 's'})`, loads: n };
};

/** Grandchild demo: payload keyed by both nesting levels. */
export const fetchNestItem = async (nestId: string, itemId: string) => {
	const n = trackCall(`nest-${nestId}-${itemId}`);
	await delay(500);
	return {
		nestId,
		itemId,
		description: `Item ${itemId} of nest ${nestId} (loaded ${n} time${n === 1 ? '' : 's'})`,
		loads: n,
	};
};

/** Heavy loader for the gcTime demo. */
export const fetchHeavy = async () => {
	const n = trackCall('heavy');
	await delay(500);
	return `Heavy payload (visit ${n})`;
};

export type Note = { id: number; text: string };
let notes: Note[] = [
	{ id: 1, text: 'Buy milk' },
	{ id: 2, text: 'Try clear-react-router' },
];
let nextId = 3;

export const fetchNotes = async (): Promise<Note[]> => {
	await delay(300);
	return [...notes];
};

export const addNote = async (text: string): Promise<Note> => {
	await delay(400);
	if (!text.trim()) throw new Error('Note text must not be empty');
	const note = { id: nextId++, text: text.trim() };
	notes = [...notes, note];
	return note;
};
