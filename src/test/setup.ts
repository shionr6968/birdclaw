import "@testing-library/jest-dom/vitest";

process.env.BIRDCLAW_DISABLE_LIVE_WRITES ??= "1";

if (
	typeof window !== "undefined" &&
	(typeof window.localStorage?.getItem !== "function" ||
		typeof window.localStorage?.setItem !== "function" ||
		typeof window.localStorage?.clear !== "function")
) {
	const store = new Map<string, string>();
	const memoryStorage = {
		getItem(key: string) {
			return store.has(key) ? (store.get(key) ?? null) : null;
		},
		setItem(key: string, value: string) {
			store.set(key, String(value));
		},
		removeItem(key: string) {
			store.delete(key);
		},
		clear() {
			store.clear();
		},
		key(index: number) {
			return Array.from(store.keys())[index] ?? null;
		},
		get length() {
			return store.size;
		},
	};

	Object.defineProperty(window, "localStorage", {
		configurable: true,
		value: memoryStorage,
	});
}
