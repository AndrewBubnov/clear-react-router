// Fallback View Transition API declarations for TypeScript toolchains whose lib.dom
// predates them (e.g. the TS 7 native port). Shapes mirror lib.dom one-to-one, so where
// lib.dom already has them this file merges silently. Remove once the minimum supported
// TypeScript ships complete View Transition types and this file becomes dead weight.
// NOTE: no imports/exports here on purpose — this must stay a global script file.

interface ViewTransition {
	readonly finished: Promise<void>;
	readonly ready: Promise<void>;
}

interface Document {
	startViewTransition(callback: () => void): ViewTransition;
}
