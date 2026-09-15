<script>
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import PageShell from '$lib/PageShell.svelte';

	/** @type {Array<Record<string, any>>} */
	let items = $state([]);
	let loading = $state(true);
	/** @type {string | null} */
	let error = $state(null);

	/** @type {string} */
	let query = $state('');
	/** @type {'sev-desc' | 'sev-asc' | 'planet'} */
	let sort = $state('sev-desc');


	/**
	 * The currently expanded quest, or null when the grid is shown.
	 * @type {Record<string, any> | null}
	 */
	let selected = $state(null);

	/** @param {Record<string, any>} item */
	function factionOf(item) {
		return String(item.faction ?? 'Unaligned');
	}

	/** @type {Array<{ name: string; quests: Array<Record<string, any>> }>} */
	let factions = $derived.by(() => {
		/** @type {Map<string, Array<Record<string, any>>>} */
		const map = new Map();
		for (const item of items) {
			const name = factionOf(item);
			const list = map.get(name);
			if (list) list.push(item);
			else map.set(name, [item]);
		}
		return [...map.entries()]
			.map(([name, quests]) => ({ name, quests }))
			.sort((a, b) => a.name.localeCompare(b.name));
	});

	/**
	 * The faction currently being viewed, derived from the URL `?faction=` param.
	 * The URL is the source of truth so the view is linkable and survives refresh.
	 * @type {string | null}
	 */
	let selectedFaction = $derived.by(() => {
		const raw = $page.url.searchParams.get('faction');
		if (!raw) return null;
		// Once data is loaded, treat an unknown faction as the grid.
		if (items.length > 0 && !factions.some((f) => f.name === raw)) return null;
		return raw;
	});

	/** Factions filtered by the search box (only used on the faction grid). */
	let visibleFactions = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return factions;
		return factions.filter((f) => f.name.toLowerCase().includes(q));
	});

	/** Quests within the selected faction, filtered by search and sorted. */
	let factionQuests = $derived.by(() => {
		if (selectedFaction === null) return [];
		const q = query.trim().toLowerCase();
		const list = items
			.filter((item) => factionOf(item) === selectedFaction)
			.filter((item) => {
				if (!q) return true;
				return (
					String(item.planet ?? '').toLowerCase().includes(q) ||
					String(item.title ?? '').toLowerCase().includes(q)
				);
			});
		const sorted = [...list];
		if (sort === 'sev-desc') sorted.sort((a, b) => b.severity - a.severity);
		else if (sort === 'sev-asc') sorted.sort((a, b) => a.severity - b.severity);
		else sorted.sort((a, b) => String(a.planet).localeCompare(String(b.planet)));
		return sorted;
	});

	let isEmpty = $derived(
		selectedFaction === null ? visibleFactions.length === 0 : factionQuests.length === 0
	);

	onMount(async () => {
		try {
			const res = await fetch(`${base}/data.json`);
			if (!res.ok) throw new Error(`Failed to load data (${res.status})`);
			items = await res.json();
		} catch (/** @type {any} */ e) {
			error = e?.message ?? 'Something went wrong loading the data.';
		} finally {
			loading = false;
		}
	});

	/** @param {string} name */
	function openFaction(name) {
		query = '';
		const url = new URL($page.url);
		url.searchParams.set('faction', name);
		goto(url.pathname + url.search, { replaceState: false, keepFocus: true, noScroll: true });
	}

	function backToFactions() {
		query = '';
		const url = new URL($page.url);
		url.searchParams.delete('faction');
		goto(url.pathname + url.search, { replaceState: false, keepFocus: true, noScroll: true });
	}

	/** @param {Record<string, any>} item */
	function open(item) {
		selected = item;
	}

	function close() {
		selected = null;
	}

	/** @param {KeyboardEvent} e */
	function onKeydown(e) {
		if (e.key !== 'Escape') return;
		if (selected) close();
		else if (selectedFaction !== null) backToFactions();
	}

	/** @param {number} severity */
	function severityLabel(severity) {
		const labels = ['Trivial', 'Minor', 'Moderate', 'Serious', 'Severe', 'Critical'];
		return labels[severity - 1] ?? 'Unknown';
	}

	/**
	 * Every planet runs the same number of stages, so entries without an explicit
	 * `max_stage` fall back to this.
	 */
	const DEFAULT_MAX_STAGE = 5;

	/**
	 * Normalize a quest's stage progress into something a bar can render.
	 * `steps` is one entry per stage so the bar can be drawn as discrete tiles.
	 * A `max` of 0 means the entry has no stages and the bar is hidden.
	 * @param {Record<string, any>} item
	 */
	function stageOf(item) {
		const raw = Number(item.max_stage ?? DEFAULT_MAX_STAGE);
		const max = Math.max(0, Math.floor(Number.isFinite(raw) ? raw : DEFAULT_MAX_STAGE));
		const current = Math.min(max, Math.max(0, Math.floor(Number(item.current_stage ?? 0)) || 0));
		return {
			current,
			max,
			complete: max > 0 && current >= max,
			steps: Array.from({ length: max }, (_, i) => i + 1)
		};
	}
</script>

<svelte:window onkeydown={onKeydown} />

<svelte:head>
	<title>Chasm Viewer — Quests</title>
</svelte:head>

<PageShell
	heading={selectedFaction ?? 'Factions'}
	tagline={selectedFaction ? 'Quests aligned with this faction' : 'Choose a faction to view its quests'}
	{loading}
	{error}
	empty={isEmpty}
>
	{#snippet toolbar()}
		{#if selectedFaction !== null}
			<button class="back" onclick={backToFactions}>← All factions</button>
		{/if}
		<input
			class="control search"
			type="search"
			placeholder={selectedFaction ? 'Search planet or quest…' : 'Search factions…'}
			bind:value={query}
		/>
		{#if selectedFaction !== null}
			<label class="sort">
				<span class="sort-label">Sort</span>
				<select class="control" bind:value={sort}>
					<option value="sev-desc">Severity (high → low)</option>
					<option value="sev-asc">Severity (low → high)</option>
					<option value="planet">Planet (A–Z)</option>
				</select>
			</label>
		{/if}
	{/snippet}

	{#if selectedFaction === null}
		{#each visibleFactions as faction (faction.name)}
			<button class="card faction-card" onclick={() => openFaction(faction.name)}>
				<h2 class="card-title">{faction.name}</h2>
				<span class="count">
					{faction.quests.length}
					{faction.quests.length === 1 ? 'quest' : 'quests'}
				</span>
			</button>
		{/each}
	{:else}
		{#each factionQuests as item (item.id)}
			{@const stage = stageOf(item)}
			<button class="card quest-card" onclick={() => open(item)}>
				<h2 class="card-title">{item.planet}</h2>
				<p class="card-quest">{item.title}</p>
				<span class="severity" data-level={item.severity}>
					Severity {item.severity} · {severityLabel(item.severity)}
				</span>
				{#if stage.max > 0}
					<span class="stage">
						<span class="stage-head">
							<span class="stage-label">Stage</span>
							<span class="stage-count" class:complete={stage.complete}>
								{stage.current} / {stage.max}
							</span>
						</span>
						<!-- One tile per stage; the count above carries the same information,
						     so the bar is a single labelled image. -->
						<span
							class="stage-bar"
							role="img"
							aria-label="Stage {stage.current} of {stage.max}"
						>
							{#each stage.steps as step (step)}
								<span class="tile" class:active={step <= stage.current}></span>
							{/each}
						</span>
					</span>
				{/if}
			</button>
		{/each}
	{/if}
</PageShell>

{#if selected}
	{@const stage = stageOf(selected)}
	<div class="overlay" role="dialog" aria-modal="true" aria-label={selected.title}>
		<!-- Full-screen button behind the panel; clicking it (or pressing Escape) closes the view -->
		<button class="backdrop" aria-label="Close" onclick={close}></button>
		<div class="panel">
			<button class="close" onclick={close} aria-label="Close">×</button>
			<p class="panel-planet">{selected.planet}</p>
			<h2 class="panel-title">{selected.title}</h2>
			<span class="severity" data-level={selected.severity}>
				Severity {selected.severity} · {severityLabel(selected.severity)}
			</span>
			{#if stage.max > 0}
				<div class="stage panel-stage">
					<span class="stage-head">
						<span class="stage-label">Stage</span>
						<span class="stage-count" class:complete={stage.complete}>
							{stage.current} / {stage.max}
						</span>
					</span>
					<span class="stage-bar" role="img" aria-label="Stage {stage.current} of {stage.max}">
						{#each stage.steps as step (step)}
							<span class="tile" class:active={step <= stage.current}></span>
						{/each}
					</span>
				</div>
			{/if}
			<p class="panel-description">{selected.description}</p>
		</div>
	</div>
{/if}

<style>
	.sort {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.sort-label {
		color: #94a3b8;
		font-size: 0.9rem;
	}

	.back {
		padding: 0.55rem 0.8rem;
		border: 1px solid #1e293b;
		border-radius: 10px;
		background: #0b1424;
		color: #e2e8f0;
		font: inherit;
		font-size: 0.95rem;
		cursor: pointer;
		transition:
			border-color 0.15s ease,
			background 0.15s ease;
	}

	.back:hover {
		border-color: #38bdf8;
		background: #111c33;
	}

	/* Cards are interactive buttons, so extend the shared base card. */
	.quest-card,
	.faction-card {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.6rem;
		text-align: left;
		color: inherit;
		cursor: pointer;
		font: inherit;
		transition:
			transform 0.15s ease,
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.quest-card:hover,
	.faction-card:hover {
		transform: translateY(-3px);
		border-color: #38bdf8;
		box-shadow: 0 10px 30px -12px rgba(56, 189, 248, 0.5);
	}

	.quest-card:focus-visible,
	.faction-card:focus-visible {
		outline: 2px solid #38bdf8;
		outline-offset: 2px;
	}

	.card-title {
		margin: 0;
		font-size: 1.2rem;
	}

	.card-quest {
		margin: 0;
		color: #cbd5e1;
		font-size: 1rem;
	}

	.count {
		display: inline-block;
		padding: 0.2rem 0.6rem;
		border-radius: 999px;
		font-size: 0.8rem;
		font-weight: 600;
		border: 1px solid #334155;
		color: #94a3b8;
	}

	.severity {
		display: inline-block;
		padding: 0.2rem 0.6rem;
		border-radius: 999px;
		font-size: 0.8rem;
		font-weight: 600;
		border: 1px solid currentColor;
		color: #94a3b8;
	}

	.severity[data-level='1'] {
		color: #4ade80;
	}
	.severity[data-level='2'] {
		color: #a3e635;
	}
	.severity[data-level='3'] {
		color: #facc15;
	}
	.severity[data-level='4'] {
		color: #fb923c;
	}
	.severity[data-level='5'] {
		color: #f87171;
	}
	.severity[data-level='6'] {
		color: #ef4444;
	}

	/* Stage progress: a discrete tile per stage, mirroring the enhancements bar. */
	.stage {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		width: 100%;
		margin-top: 0.1rem;
	}

	.stage-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.stage-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #64748b;
	}

	.stage-count {
		font-size: 0.8rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: #94a3b8;
	}

	.stage-count.complete {
		color: #4ade80;
	}

	.stage-bar {
		display: flex;
		gap: 3px;
	}

	.tile {
		flex: 1 1 0;
		height: 0.6rem;
		border: 1px solid #1e293b;
		border-radius: 3px;
		background: #0b1424;
		transition:
			background 0.15s ease,
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.tile.active {
		border-color: #38bdf8;
		background: #38bdf8;
		box-shadow: 0 0 12px -2px rgba(56, 189, 248, 0.6);
	}

	.panel-stage {
		margin: 0 0 1.5rem;
		max-width: 420px;
	}

	.panel-stage .tile {
		height: 0.9rem;
		border-radius: 4px;
	}

	.overlay {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		z-index: 10;
		animation: fade 0.15s ease;
	}

	.backdrop {
		position: fixed;
		inset: 0;
		border: none;
		padding: 0;
		background: rgba(2, 6, 23, 0.8);
		backdrop-filter: blur(4px);
		cursor: pointer;
	}

	.panel {
		position: relative;
		z-index: 1;
		width: min(900px, 100%);
		max-height: 90vh;
		overflow-y: auto;
		background: #0b1424;
		border: 1px solid #1e293b;
		border-radius: 18px;
		padding: 3rem clamp(1.5rem, 5vw, 3.5rem);
		box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.6);
		animation: pop 0.15s ease;
	}

	.panel-planet {
		margin: 0 0 0.25rem;
		color: #38bdf8;
		font-size: 0.95rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.panel-title {
		margin: 0 0 1rem;
		font-size: clamp(1.75rem, 4vw, 2.5rem);
		letter-spacing: -0.02em;
	}

	.panel .severity {
		margin-bottom: 1.25rem;
	}

	.panel-description {
		margin: 0;
		font-size: 1.15rem;
		line-height: 1.7;
		color: #cbd5e1;
	}

	.close {
		position: absolute;
		top: 1rem;
		right: 1rem;
		width: 2.5rem;
		height: 2.5rem;
		border: none;
		border-radius: 50%;
		background: #1e293b;
		color: #e2e8f0;
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.close:hover {
		background: #334155;
	}

	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes pop {
		from {
			opacity: 0;
			transform: scale(0.96);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
