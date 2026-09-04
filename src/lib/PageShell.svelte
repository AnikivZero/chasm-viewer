<script>
	/**
	 * `layout` controls how cards flow: 'grid' packs them into responsive
	 * columns, 'rows' gives each card a full-width row of its own.
	 * @type {{
	 *   heading: string;
	 *   tagline: string;
	 *   loading: boolean;
	 *   error: string | null;
	 *   empty: boolean;
	 *   layout?: 'grid' | 'rows';
	 *   toolbar?: import('svelte').Snippet;
	 *   children: import('svelte').Snippet;
	 * }}
	 */
	let { heading, tagline, loading, error, empty, layout = 'grid', toolbar, children } = $props();
</script>

<main>
	<header class="page-header">
		<h1>{heading}</h1>
		<p>{tagline}</p>
	</header>

	{#if toolbar}
		<div class="toolbar">{@render toolbar()}</div>
	{/if}

	{#if loading}
		<p class="status">Loading…</p>
	{:else if error}
		<p class="status error">{error}</p>
	{:else if empty}
		<p class="status">No matches.</p>
	{:else}
		<section class="grid" class:rows={layout === 'rows'}>
			{@render children()}
		</section>
	{/if}
</main>

<style>
	main {
		max-width: 1100px;
		margin: 0 auto;
		padding: 2.5rem 1.5rem 4rem;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.page-header h1 {
		margin: 0;
		font-size: clamp(1.75rem, 4vw, 2.75rem);
		letter-spacing: -0.02em;
	}

	.page-header p {
		margin: 0.5rem 0 0;
		color: #94a3b8;
	}

	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.75rem;
	}

	.status {
		color: #94a3b8;
		font-size: 1.05rem;
	}

	.status.error {
		color: #f87171;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 1.25rem;
	}

	.grid.rows {
		grid-template-columns: 1fr;
	}

	/* Base card styles are shared across pages. Card markup is provided by the
	   parent via the children snippet, so we expose these selectors globally. */
	:global(.card) {
		padding: 1.4rem;
		border: 1px solid #1e293b;
		border-radius: 14px;
		background: #111c33;
	}

	/* Shared themed form controls used inside toolbars. */
	:global(.control) {
		padding: 0.55rem 0.8rem;
		border: 1px solid #1e293b;
		border-radius: 10px;
		background: #0b1424;
		color: #e2e8f0;
		font: inherit;
		font-size: 0.95rem;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	:global(.control::placeholder) {
		color: #64748b;
	}

	:global(.control:focus) {
		outline: none;
		border-color: #38bdf8;
		box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.25);
	}

	:global(.search) {
		flex: 1 1 240px;
		min-width: 200px;
	}
</style>
