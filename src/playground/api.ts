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
let loaderCalls = 0;

export const getLoaderStats = () => ({ calls: loaderCalls });

export const resetLoaderStats = () => {
	loaderCalls = 0;
};

const trackCall = () => {
	loaderCalls += 1;
	return loaderCalls;
};

/** Fails randomly (~50%) after a short delay. Powers the retry demo. */
export const fetchUnstable = async () => {
	const attempt = trackCall();
	await delay(400);
	if (Math.random() < 0.5) {
		throw new Error(`Random server hiccup on attempt ${attempt} — retry should kick in`);
	}
	return { value: `Lucky payload (attempt ${attempt})`, attempt };
};

/** Always-failing twin for the errorElement demo (no retry configured). */
export const fetchDoomed = async () => {
	trackCall();
	await delay(400);
	throw new Error('Server is having a bad day (no retry on this route)');
};

/** Random-walking quotes. Powers the polling demo. */
export const fetchQuotes = async (): Promise<{ tick: number; quotes: Quote[] }> => {
	trackCall();
	await delay(200);
	tick += 1;
	const quotes = Object.entries(PRICES).map(([symbol, base]) => {
		const drift = (Math.random() - 0.5) * base * 0.04;
		PRICES[symbol] = Math.round((base + drift) * 100) / 100;
		return { symbol, price: PRICES[symbol] };
	});
	return { tick, quotes };
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
