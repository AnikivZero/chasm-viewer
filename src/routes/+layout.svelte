<script>
	import favicon from '$lib/assets/favicon.svg';
	import { base } from '$app/paths';
	import { page } from '$app/stores';

	let { children } = $props();

	let pathname = $derived($page.url.pathname);
	let questsActive = $derived(pathname === `${base}/` || pathname === base || pathname === '/');
	let modsActive = $derived(pathname === `${base}/mods` || pathname === `${base}/mods/`);
	let enhancementsActive = $derived(
		pathname === `${base}/enhancements` || pathname === `${base}/enhancements/`
	);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<nav class="nav">
	<div class="nav-inner">
		<span class="brand">Chasm Viewer</span>
		<div class="tabs">
			<a class="tab" class:active={questsActive} href="{base}/">Quests</a>
			<a class="tab" class:active={modsActive} href="{base}/mods">Mods</a>
			<a class="tab" class:active={enhancementsActive} href="{base}/enhancements">Enhancements</a>
		</div>
	</div>
</nav>

{@render children()}

<style>
	:global(body) {
		margin: 0;
		background: #0f172a;
		color: #e2e8f0;
		font-family:
			system-ui,
			-apple-system,
			'Segoe UI',
			Roboto,
			sans-serif;
	}

	.nav {
		position: sticky;
		top: 0;
		z-index: 5;
		background: rgba(11, 20, 36, 0.85);
		backdrop-filter: blur(8px);
		border-bottom: 1px solid #1e293b;
	}

	.nav-inner {
		max-width: 1100px;
		margin: 0 auto;
		padding: 0.85rem 1.5rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.brand {
		font-weight: 600;
		letter-spacing: -0.01em;
		color: #e2e8f0;
	}

	.tabs {
		display: flex;
		gap: 0.5rem;
	}

	.tab {
		padding: 0.45rem 0.9rem;
		border-radius: 9px;
		text-decoration: none;
		color: #94a3b8;
		font-size: 0.95rem;
		transition:
			background 0.15s ease,
			color 0.15s ease;
	}

	.tab:hover {
		color: #e2e8f0;
		background: #1e293b;
	}

	.tab.active {
		color: #0f172a;
		background: #38bdf8;
		font-weight: 600;
	}
</style>
