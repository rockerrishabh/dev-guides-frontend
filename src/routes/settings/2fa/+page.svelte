<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { generate2FA, enable2FA } from '$lib/api/auth';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent,
		CardFooter
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { z } from 'zod';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { zod4, zod4Client } from 'sveltekit-superforms/adapters';
	import { Spinner } from '$lib/components/ui/spinner';
	import { ShieldCheck } from '@lucide/svelte';

	let setup = $state<{ secret: string; qr_code_url: string } | null>(null);
	let loadingSetup = $state(false);
	let apiError = $state<string | null>(null);
	let enabled = $state(false);

	const schema = z.object({
		code: z
			.string()
			.min(6, 'Code must be 6 digits')
			.max(6, 'Code must be 6 digits')
			.regex(/^\d+$/, 'Digits only')
	});

	let submitting = $state(false);

	const { form, errors, enhance } = superForm(defaults(zod4(schema)), {
		SPA: true,
		validators: zod4Client(schema),
		async onUpdate({ form }) {
			if (!form.valid || !setup) return;
			submitting = true;
			apiError = null;
			try {
				await enable2FA({ secret: setup.secret, code: form.data.code });
				enabled = true;
				toast.success('Two-factor authentication enabled!');
			} catch (e: unknown) {
				apiError = e instanceof Error ? e.message : 'Failed to enable 2FA.';
			} finally {
				submitting = false;
			}
		}
	});

	onMount(async () => {
		// Guard: must be logged in
		const check = setInterval(() => {
			if (!auth.initialized) return;
			clearInterval(check);
			if (!auth.isAuthenticated) {
				goto('/login');
				return;
			}
			startSetup();
		}, 50);
	});

	async function startSetup() {
		loadingSetup = true;
		try {
			setup = await generate2FA();
		} catch (e: unknown) {
			apiError = e instanceof Error ? e.message : 'Failed to generate 2FA setup.';
		} finally {
			loadingSetup = false;
		}
	}
</script>

<div class="mx-auto max-w-lg px-4 py-12">
	<h1 class="mb-6 text-2xl font-bold">Enable Two-Factor Authentication</h1>

	{#if enabled}
		<Card class="text-center">
			<CardHeader class="items-center">
				<div class="mb-2 flex size-14 items-center justify-center rounded-full bg-green-500/10">
					<ShieldCheck class="size-7 text-green-500" />
				</div>
				<CardTitle>2FA Enabled!</CardTitle>
				<CardDescription
					>Your account is now protected by two-factor authentication.</CardDescription
				>
			</CardHeader>
			<CardFooter class="justify-center">
				<Button onclick={() => goto('/dashboard')}>Back to dashboard</Button>
			</CardFooter>
		</Card>
	{:else}
		<div class="grid gap-6">
			<!-- Step 1 -->
			<Card>
				<CardHeader>
					<CardTitle>Step 1 — Scan the QR code</CardTitle>
					<CardDescription>
						Open your authenticator app (Google Authenticator, Authy, etc.) and scan the QR code
						below.
					</CardDescription>
				</CardHeader>
				<CardContent class="flex flex-col items-center gap-4">
					{#if loadingSetup}
						<Spinner class="size-8" />
					{:else if setup}
						<img
							src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setup.qr_code_url)}`}
							alt="2FA QR code"
							class="size-48 rounded-md border"
						/>
						<div class="w-full">
							<Label class="mb-1 block text-xs text-muted-foreground">
								Or enter the secret manually:
							</Label>
							<code class="block w-full rounded-md bg-muted px-3 py-2 text-xs break-all">
								{setup.secret}
							</code>
						</div>
					{:else if apiError}
						<p class="text-sm text-destructive">{apiError}</p>
					{/if}
				</CardContent>
			</Card>

			<!-- Step 2 -->
			<Card>
				<CardHeader>
					<CardTitle>Step 2 — Confirm with a code</CardTitle>
					<CardDescription>
						Enter the 6-digit code from your authenticator app to verify the setup.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form method="POST" use:enhance class="grid gap-4">
						{#if apiError && !loadingSetup}
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
								disabled={submitting || loadingSetup || !setup}
							/>
							{#if $errors.code}
								<span class="text-sm font-medium text-destructive">{$errors.code}</span>
							{/if}
						</div>
						<Button type="submit" class="w-full" disabled={submitting || loadingSetup || !setup}>
							{#if submitting}
								<Spinner class="mr-2 size-4" />
								Verifying…
							{:else}
								Enable 2FA
							{/if}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	{/if}
</div>
