<script lang="ts">
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
	import { forgotPassword } from '$lib/api/auth';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { Spinner } from '$lib/components/ui/spinner';
	import { CircleCheck } from '@lucide/svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { untrack } from 'svelte';

	$effect(() => {
		if (auth.isAuthenticated && auth.initialized) {
			untrack(() => goto('/dashboard'));
		}
	});

	let email = $state('');
	let submitting = $state(false);
	let apiError = $state<string | null>(null);
	let success = $state(false);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!email) return;

		submitting = true;
		apiError = null;

		try {
			await forgotPassword(email);
			success = true;
			toast.success('Reset link sent if account exists.');
		} catch (e: unknown) {
			apiError = e instanceof Error ? e.message : 'Something went wrong.';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="mt-10 flex min-h-[80vh] flex-1 items-center justify-center p-4">
	<Card class="w-full max-w-sm">
		{#if !success}
			<CardHeader>
				<CardTitle class="text-2xl">Forgot Password</CardTitle>
				<CardDescription>Enter your email address and we'll send you a link to reset your password.</CardDescription>
			</CardHeader>
			<CardContent>
				<form onsubmit={handleSubmit} class="grid gap-4">
					{#if apiError}
						<div
							class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
						>
							{apiError}
						</div>
					{/if}
					<div class="grid gap-2">
						<Label for="email">Email</Label>
						<Input
							id="email"
							type="email"
							bind:value={email}
							placeholder="m@example.com"
							required
							disabled={submitting}
						/>
					</div>
					<Button type="submit" class="w-full" disabled={submitting}>
						{#if submitting}
							<Spinner class="mr-2 size-4" />
							Sending link…
						{:else}
							Send Reset Link
						{/if}
					</Button>
				</form>
			</CardContent>
			<CardFooter>
				<div class="w-full text-center text-sm">
					Remembered your password?
					<a href="/login" class="underline">Back to login</a>
				</div>
			</CardFooter>
		{:else}
			<CardHeader class="items-center text-center">
				<div class="mb-2 flex size-14 items-center justify-center rounded-full bg-green-500/10">
					<CircleCheck class="size-7 text-green-500" />
				</div>
				<CardTitle class="text-2xl">Email Sent</CardTitle>
				<CardDescription>
					If an account exists for <strong>{email}</strong>, you will receive a password reset link shortly.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Button variant="outline" class="w-full" onclick={() => goto('/login')}>
					Return to login
				</Button>
			</CardContent>
		{/if}
	</Card>
</div>
