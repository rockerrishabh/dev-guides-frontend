<script lang="ts">
	import { z } from 'zod';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { zod4, zod4Client } from 'sveltekit-superforms/adapters';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent,
		CardFooter
	} from '$lib/components/ui/card';
	import { verify2FA } from '$lib/api/auth';
	import { auth } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import { Spinner } from '$lib/components/ui/spinner';
	import { ShieldCheck } from '@lucide/svelte';
	import { untrack, tick } from 'svelte';


	// Read the temporary_token and remember_me from query params.
	const temporaryToken = $derived(page.url.searchParams.get('token') ?? '');
	const rememberMe = $derived(page.url.searchParams.get('remember') === 'true');

	$effect(() => {
		console.log('2FA page state:', { 
			isAuthenticated: auth.isAuthenticated, 
			initialized: auth.initialized,
			token: temporaryToken 
		});
		if (auth.isAuthenticated && auth.initialized) {
			console.log('2FA page: Redirecting to dashboard (already auth)');
			untrack(async () => {
				await tick();
				goto('/dashboard', { replaceState: true });
			});
		}
	});

	const schema = z.object({
		code: z
			.string()
			.min(6, 'Code must be 6 digits')
			.max(6, 'Code must be 6 digits')
			.regex(/^\d+$/, 'Code must contain only digits')
	});

	let submitting = $state(false);
	let apiError = $state<string | null>(null);

	const { form, errors, enhance } = superForm(defaults(zod4(schema)), {
		SPA: true,
		validators: zod4Client(schema),
		async onUpdate({ form }) {
			if (!form.valid) return;
			if (!temporaryToken) {
				apiError = 'Missing 2FA session. Please login again.';
				return;
			}

			submitting = true;
			apiError = null;

			try {
				const result = await verify2FA({
					temporary_token: temporaryToken,
					code: form.data.code,
					remember_me: rememberMe
				});
				auth.setUser(result.user);
				toast.success(`Welcome back, ${result.user.name}!`);
				// Redirection is handled by the $effect above
			} catch (e: unknown) {
				apiError = e instanceof Error ? e.message : 'Invalid code. Please try again.';
			} finally {
				submitting = false;
			}
		}
	});
</script>

<div class="mt-10 flex min-h-[80vh] flex-1 items-center justify-center p-4">
	<Card class="w-full max-w-sm">
		<CardHeader class="items-center text-center">
			<div class="mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
				<ShieldCheck class="size-6 text-primary" />
			</div>
			<CardTitle class="text-2xl">Two-Factor Authentication</CardTitle>
			<CardDescription
				>Enter the 6-digit code from your authenticator app to continue.</CardDescription
			>
		</CardHeader>
		<CardContent>
			<form method="POST" use:enhance class="grid gap-4">
				{#if apiError}
					<div
						class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{apiError}
					</div>
				{/if}
				<div class="grid gap-2">
					<Label for="code">Authenticator Code</Label>
					<Input
						id="code"
						name="code"
						type="text"
						inputmode="numeric"
						autocomplete="one-time-code"
						bind:value={$form.code}
						placeholder="000000"
						maxlength={6}
						class="rounded-md text-center text-xl tracking-[0.5em]"
						disabled={submitting}
					/>
					{#if $errors.code}
						<span class="text-sm font-medium text-destructive">{$errors.code}</span>
					{/if}
				</div>
				<Button type="submit" class="mt-2 w-full" disabled={submitting || !temporaryToken}>
					{#if submitting}
						<Spinner class="mr-2 size-4" />
						Verifying…
					{:else}
						Verify Code
					{/if}
				</Button>
			</form>
		</CardContent>
		<CardFooter>
			<div class="w-full text-center text-sm text-muted-foreground">
				<a href="/login" class="underline">Back to login</a>
			</div>
		</CardFooter>
	</Card>
</div>
