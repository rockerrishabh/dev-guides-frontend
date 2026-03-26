<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';
	import { ModeWatcher } from 'mode-watcher';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Toaster } from '$lib/components/ui/sonner';
	import { auth } from '$lib/stores/auth.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		auth.init();
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<Toaster />
<ModeWatcher />
<Header />
<Tooltip.Provider>
	<main>{@render children()}</main>
</Tooltip.Provider>
