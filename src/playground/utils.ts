// Mirrors the library's isMobile(): menu links prefetch on mount for these visitors,
// so loader counters below may grow before anything is tapped.
export const isMobileViewport =
	typeof window !== 'undefined' &&
	window.matchMedia('(pointer: coarse)').matches &&
	window.matchMedia('(max-width: 768px)').matches;
