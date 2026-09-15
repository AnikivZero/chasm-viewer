<script>
	import PageShell from '$lib/PageShell.svelte';
	import { jsonResource } from '$lib/jsonResource.svelte.js';

	const data = jsonResource('enhancements.json');
	let items = $derived(data.items);

	/**
	 * A single reward tier: the progress needed, the reward, and whether it is
	 * already earned.
	 * @typedef {{ threshold: number; reward: string; active: boolean }} Tier
	 */

	/**
	 * Turn a raw json entry into the shape the card renders. `breakpoints` is a
	 * list of `[threshold, reward]` pairs, which we sort ascending so the bar
	 * reads left-to-right even if the data is out of order.
	 * @param {Record<string, any>} item
	 */
	function parse(item) {
		const progress = Number(item.current_progress ?? 0);
		const raw = Array.isArray(item.breakpoints) ? item.breakpoints : [];

		/** @type {Tier[]} */
		const tiers = raw
			.map((pair) => ({ threshold: Number(pair?.[0] ?? 0), reward: String(pair?.[1] ?? '') }))
			.sort((a, b) => a.threshold - b.threshold)
			.map((tier) => ({ ...tier, active: progress >= tier.threshold }));

		return {
			stat: String(item.stat ?? 'unknown'),
			label: String(item.stat ?? 'unknown').toUpperCase(),
			progress,
			tiers,
			// The final breakpoint is the goal for the whole track.
			goal: tiers.length > 0 ? tiers[tiers.length - 1].threshold : 0,
			unlocked: tiers.filter((tier) => tier.active).length
		};
	}

	// Rows render in file order, so the json controls the stat ordering.
	let enhancements = $derived(items.map(parse));

</script>

<svelte:head>
	<title>Chasm Viewer — Enhancements</title>
</svelte:head>

<PageShell
	heading="Enhancements"
	tagline="Push a stat past a breakpoint to claim its reward."
	loading={data.loading}
	error={data.error}
	empty={enhancements.length === 0}
	layout="rows"
>
	{#each enhancements as entry (entry.stat)}
		<article class="card enhancement-card">
			<div class="stat">
				<h2 class="card-title">{entry.label}</h2>
				<span class="progress">{entry.progress} / {entry.goal}</span>
				<span class="summary">
					{entry.unlocked} of {entry.tiers.length}
					{entry.tiers.length === 1 ? 'reward' : 'rewards'} active
				</span>
			</div>

			<div class="track">
				<!-- One tile per breakpoint. The textual reward list below carries the
				     same information, so the bar itself is a single labelled image. -->
				<div
					class="bar"
					role="img"
					aria-label="{entry.unlocked} of {entry.tiers.length} rewards active"
				>
					{#each entry.tiers as tier (tier.threshold)}
						<span
							class="tile"
							class:active={tier.active}
							title="{tier.threshold} — {tier.reward}"
						></span>
					{/each}
				</div>

				<ul class="tiers">
					{#each entry.tiers as tier (tier.threshold)}
						<li class="tier" class:active={tier.active}>
							<span class="threshold">{tier.threshold}</span>
							<span class="reward">{tier.reward}</span>
						</li>
					{/each}
				</ul>
			</div>
		</article>
	{/each}
</PageShell>

<style>
	/* Each card owns a full-width row, so split it into a stat column and the
	   reward track. Collapses to a single column on narrow screens. */
	.enhancement-card {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.9rem;
	}

	@media (min-width: 640px) {
		.enhancement-card {
			grid-template-columns: minmax(7rem, 10rem) 1fr;
			align-items: start;
			gap: 1.75rem;
		}
	}

	.stat {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.3rem 0.75rem;
	}

	@media (min-width: 640px) {
		.stat {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.35rem;
		}
	}

	.track {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		min-width: 0;
	}

	.card-title {
		margin: 0;
		font-size: 1.15rem;
		letter-spacing: 0.06em;
	}

	.progress {
		flex-shrink: 0;
		font-size: 0.85rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: #94a3b8;
	}

	.bar {
		display: flex;
		gap: 4px;
	}

	.tile {
		flex: 1 1 0;
		height: 1.5rem;
		border: 1px solid #1e293b;
		border-radius: 4px;
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

	.summary {
		font-size: 0.85rem;
		color: #64748b;
	}

	.tiers {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.tier {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
		color: #64748b;
	}

	.tier.active {
		color: #cbd5e1;
	}

	.threshold {
		flex-shrink: 0;
		min-width: 3ch;
		padding: 0.15rem 0.5rem;
		border: 1px solid #334155;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		text-align: center;
	}

	.tier.active .threshold {
		border-color: #38bdf8;
		color: #38bdf8;
	}

	.reward {
		line-height: 1.5;
	}
</style>
