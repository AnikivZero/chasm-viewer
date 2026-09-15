import { base } from '$app/paths';
import { onMount } from 'svelte';

/**
 * Loads a json file from the static directory once the calling component mounts,
 * and exposes the request as reactive state.
 *
 * The site runs as an SPA (`ssr = false`), so every page fetches its data in the
 * browser and needs the same three pieces of state while that happens. Call this
 * during component initialisation, since it registers an `onMount` handler:
 *
 * ```js
 * const data = jsonResource('mods.json');
 * let items = $derived(data.items);
 * ```
 *
 * @param {string} file Path relative to the static directory, e.g. 'data.json'.
 */
export function jsonResource(file) {
	/** @type {Array<Record<string, any>>} */
	let items = $state([]);
	let loading = $state(true);
	/** @type {string | null} */
	let error = $state(null);

	onMount(async () => {
		try {
			const res = await fetch(`${base}/${file}`);
			if (!res.ok) throw new Error(`Failed to load data (${res.status})`);
			items = await res.json();
		} catch (/** @type {any} */ e) {
			error = e?.message ?? 'Something went wrong loading the data.';
		} finally {
			loading = false;
		}
	});

	// Returned as getters so callers read the live state rather than a snapshot
	// taken at the moment this function ran.
	return {
		get items() {
			return items;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		}
	};
}
