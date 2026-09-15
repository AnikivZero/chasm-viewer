<script>
	import PageShell from '$lib/PageShell.svelte';
	import { jsonResource } from '$lib/jsonResource.svelte.js';

	const data = jsonResource('mods.json');
	let items = $derived(data.items);

	/** @type {string} */
	let query = $state('');
	/** @type {'All' | 'Mod' | 'Accessory'} */
	let typeFilter = $state('All');

	let filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		return items.filter((item) => {
			if (typeFilter !== 'All' && item.type !== typeFilter) return false;
			if (!q) return true;
			return (
				String(item.title ?? '').toLowerCase().includes(q) ||
				String(item.effect ?? '').toLowerCase().includes(q)
			);
		});
	});

</script>

<svelte:head>
	<title>Chasm Viewer — Mods</title>
</svelte:head>

<PageShell
	heading="Mods & Accessories"
	tagline="Gear up before you descend."
	loading={data.loading}
	error={data.error}
	empty={filtered.length === 0}
>
	{#snippet toolbar()}
		<input
			class="control search"
			type="search"
			placeholder="Search title or effect…"
			bind:value={query}
		/>
		<label class="filter">
			<span class="filter-label">Type</span>
			<select class="control" bind:value={typeFilter}>
				<option value="All">All</option>
				<option value="Mod">Mod</option>
				<option value="Accessory">Accessory</option>
			</select>
		</label>
	{/snippet}

	{#each filtered as item (item.id)}
		<article class="card mod-card">
			<div class="card-head">
				<h2 class="card-title">{item.title}</h2>
				<span class="type" data-type={item.type}>{item.type}</span>
			</div>
			<p class="card-effect">{item.effect}</p>
		</article>
	{/each}
</PageShell>

<style>
	.filter {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.filter-label {
		color: #94a3b8;
		font-size: 0.9rem;
	}

	.mod-card {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.card-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.card-title {
		margin: 0;
		font-size: 1.15rem;
	}

	.type {
		flex-shrink: 0;
		padding: 0.2rem 0.6rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		background: #1e293b;
		color: #94a3b8;
	}

	.type[data-type='Mod'] {
		background: rgba(56, 189, 248, 0.15);
		color: #38bdf8;
	}

	.type[data-type='Accessory'] {
		background: rgba(167, 139, 250, 0.15);
		color: #a78bfa;
	}

	.card-effect {
		margin: 0;
		color: #94a3b8;
		line-height: 1.55;
	}
</style>
