import type { Location } from '../clear-router';

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

const trackCall = (key: string) => {
	loaderCalls[key] = (loaderCalls[key] ?? 0) + 1;
	return loaderCalls[key];
};

/** Fails randomly (~50%) after a short delay. Powers the retry demo. */
export const fetchUnstable = async ({ attempt }: { attempt: number }) => {
	await delay(400);
	if (Math.random() < 0.5) {
		throw new Error(`Random server hiccup on attempt ${attempt} — retry should kick in`);
	}
	return { value: 'Lucky payload', attempt, fetchedAt: Date.now() };
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
	await delay(400);
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

/** The cache lab route sets this staleTime, so revisits within the window reuse the payload. */
export const CACHE_STALE_TIME = 10000;

/** Payload for the cache lab home page itself. */
export const fetchCachePayload = async () => {
	const n = trackCall('cache');
	await delay(600);
	return `Cache lab payload (call ${n})`;
};

const timeNow = () => new Date().toLocaleTimeString('en-GB');

const TRAFFIC = [
	{ label: 'Organic search', color: 'teal', value: 38 },
	{ label: 'Direct', color: 'blue', value: 27 },
	{ label: 'Referrals', color: 'grape', value: 21 },
	{ label: 'Social', color: 'orange', value: 14 },
];

/**
 * Deferred render demo: the route resolves fast with a summary, while the chart
 * is a promise inside that data payload. React `use()` suspends only the chart.
 */
export const fetchDeferredDashboard = async () => {
	const n = trackCall('deferred');
	await delay(400);
	const shift = (n - 1) % TRAFFIC.length;
	const traffic = delay(1600).then(() => [...TRAFFIC.slice(shift), ...TRAFFIC.slice(0, shift)]);
	return { call: n, fetchedAt: timeNow(), traffic };
};

/** Nest demo: per-id payload with visible latency, cached separately per params. */
export const fetchNest = async (nestId: string) => {
	const n = trackCall(`nest-${nestId}`);
	await delay(500);
	return {
		nestId,
		description: `Nest ${nestId} (loaded ${n} time${n === 1 ? '' : 's'} at ${timeNow()})`,
		loads: n,
	};
};

/** Grandchild demo: payload keyed by both nesting levels. */
export const fetchNestItem = async (nestId: string, itemId: string) => {
	const n = trackCall(`nest-${nestId}-${itemId}`);
	await delay(500);
	return {
		nestId,
		itemId,
		description: `Item ${itemId} of nest ${nestId} (loaded ${n} time${n === 1 ? '' : 's'} at ${timeNow()})`,
		loads: n,
	};
};

/** The external-cache demo: TanStack Query owns freshness with this staleTime. */
export const EXTERNAL_QUOTE_STALE_TIME = 5000;

export type ExternalQuote = { symbol: string; price: number; loads: number; fetchedAt: string };

/**
 * Drifting quote for the external-cache demo. `loads` rides inside the payload
 * so every consumer of the fact sees the same fetch counter.
 */
export const fetchExternalQuote = async (symbol: string): Promise<ExternalQuote> => {
	const n = trackCall(`ext-${symbol}`);
	await delay(500);
	const base = PRICES[symbol] ?? 50;
	const drift = (Math.random() - 0.5) * base * 0.04;
	PRICES[symbol] = Math.round((base + drift) * 100) / 100;
	return { symbol, price: PRICES[symbol], loads: n, fetchedAt: timeNow() };
};

/** gcTime for /playground/heavy — also drives the live countdown in the cache lab. */
export const HEAVY_GC_TIME = 10000;

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
	trackCall('notes');
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

export const randomIds = (prefix: string) => {
	const ids = new Set<number>();
	while (ids.size < 3) ids.add(Math.floor(Math.random() * 90) + 10);
	return [...ids].map(n => `${prefix}-${n}`);
};

// --- Table demo: loader-driven table with the whole query state in the URL ---

export type TableRow = {
	id: number;
	product: string;
	brand: string;
	price: number;
	status: 'in stock' | 'low stock' | 'archived';
};

const TABLE_BRANDS = ['nike', 'reebok', 'adidas'];
const TABLE_PRODUCTS = ['Air Zoom', 'Pegasus', 'Nano', 'Classic', 'Ultraboost', 'Samba', 'Metcon', 'Court'];
const TABLE_STATUSES = ['in stock', 'low stock', 'archived'] as const;

export const TABLE_ROWS: TableRow[] = Array.from({ length: 48 }, (_, i) => ({
	id: 1001 + i,
	product: TABLE_PRODUCTS[i % TABLE_PRODUCTS.length],
	brand: TABLE_BRANDS[Math.floor(i / TABLE_PRODUCTS.length) % TABLE_BRANDS.length],
	price: 29 + ((i * 7) % 120),
	status: TABLE_STATUSES[i % TABLE_STATUSES.length],
}));

export const TABLE_PAGE_SIZE = 8;

export type TablePayload = {
	items: TableRow[];
	total: number;
	page: number;
	pageCount: number;
	loads: number;
	fetchedAt: string;
};

const TABLE_COLUMNS = ['id', 'product', 'brand', 'price', 'status'] as const;

/** The table's "server": filter, sort and paginate from the URL search only. */
export const fetchTableData = async ({ location }: { location: Location }): Promise<TablePayload> => {
	const n = trackCall('table');
	await delay(350);
	const params = new URLSearchParams(location.search);
	const q = (params.get('q') ?? '').trim().toLowerCase();
	const brands = params.getAll('brand');
	const sortParam = params.get('sort') ?? 'id';
	const sort = (TABLE_COLUMNS as readonly string[]).includes(sortParam) ? sortParam : 'id';
	const desc = params.get('dir') === 'desc';
	const page = Math.max(1, Number(params.get('page')) || 1);

	let rows = TABLE_ROWS;
	if (brands.length) {
		rows = rows.filter(row => brands.includes(row.brand));
	}
	if (q) {
		rows = rows.filter(row =>
			[row.product, row.brand, row.status, String(row.id)].some(value => value.toLowerCase().includes(q))
		);
	}
	rows = [...rows].sort((a, b) => {
		const key = sort as keyof TableRow;
		const av = a[key];
		const bv = b[key];
		const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
		return desc ? -cmp : cmp;
	});

	const pageCount = Math.max(1, Math.ceil(rows.length / TABLE_PAGE_SIZE));
	const safePage = Math.min(page, pageCount);
	return {
		items: rows.slice((safePage - 1) * TABLE_PAGE_SIZE, safePage * TABLE_PAGE_SIZE),
		total: rows.length,
		page: safePage,
		pageCount,
		loads: n,
		fetchedAt: timeNow(),
	};
};
