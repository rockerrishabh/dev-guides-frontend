<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { verifyEmail } from '$lib/api/auth';
	import { goto } from '$app/navigation';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import { CircleCheck, CircleX } from '@lucide/svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { untrack } from 'svelte';

	$effect(() => {
		if (auth.isAuthenticated && auth.user?.is_verified && auth.initialized) {
			untrack(() => goto('/dashboard'));
		}
	});

	type Status = 'loading' | 'success' | 'error';

	let status: Status = $state('loading');
	let errorMessage = $state('');

	let processing = false;

	onMount(async () => {
		if (processing) return;
		processing = true;

		const token = page.url.searchParams.get('token');
		const email = page.url.searchParams.get('email');

		if (!token) {
			errorMessage = 'No verification token found in the URL.';
			status = 'error';
			return;
		}
		try {
			await verifyEmail(token, email);
			status = 'success';
		} catch (e: unknown) {
			errorMessage = e instanceof Error ? e.message : 'Verification failed.';
			status = 'error';
		}
	});
</script>

<div class="mt-10 flex min-h-[80vh] flex-1 items-center justify-center p-4">
	<Card class="w-full max-w-sm text-center">
		<CardHeader class="items-center">
			{#if status === 'loading'}
				<div class="mb-2 flex size-14 items-center justify-center rounded-full bg-muted">
					<Spinner class="size-7" />
				</div>
				<CardTitle class="text-2xl">Verifying your email…</CardTitle>
				<CardDescription>Please wait a moment.</CardDescription>
			{:else if status === 'success'}
				<div class="mb-2 flex size-14 items-center justify-center rounded-full bg-green-500/10">
					<CircleCheck class="size-7 text-green-500" />
				</div>
				<CardTitle class="text-2xl">Email verified!</CardTitle>
				<CardDescription>Your account is now active. You can log in.</CardDescription>
			{:else}
				<div class="mb-2 flex size-14 items-center justify-center rounded-full bg-destructive/10">
					<CircleX class="size-7 text-destructive" />
				</div>
				<CardTitle class="text-2xl">Verification failed</CardTitle>
				<CardDescription>{errorMessage}</CardDescription>
			{/if}
		</CardHeader>
		<CardContent>
			{#if status === 'success'}
				<Button class="w-full" onclick={() => goto('/login')}>Go to login</Button>
			{:else if status === 'error'}
				<div class="flex flex-col gap-2">
					<Button class="w-full" onclick={() => goto('/login')}>Go to login</Button>
					<Button variant="ghost" class="w-full" onclick={() => goto('/register')}>
						Register again
					</Button>
				</div>
			{/if}
		</CardContent>
	</Card>
</div>
