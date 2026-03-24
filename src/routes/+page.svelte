<script lang="ts">
	import { onMount } from 'svelte';

	let message = $state('');

	onMount(() => {
		fetch('https://api.savviest.online/v1/health')
			.then((res) => res.json())
			.then((data) => {
				message = data.message;
			})
			.catch((err) => console.log(err));
	});
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Home" />
</svelte:head>

<main>
	<h1>Home</h1>
	<p>
		{#if message}
			{message}
		{:else}
			Loading...
		{/if}
	</p>
</main>
