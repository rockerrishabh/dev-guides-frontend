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
	import { resetPassword } from '$lib/api/auth';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import { Spinner } from '$lib/components/ui/spinner';
	import { CircleCheck, CircleX } from '@lucide/svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { untrack } from 'svelte';

	$effect(() => {
		if (auth.isAuthenticated && auth.initialized) {
			untrack(() => goto('/dashboard'));
		}
	});

	let password = $state('');
	let confirmPassword = $state('');
	let submitting = $state(false);
	let apiError = $state<string | null>(null);
	let success = $state(false);

	const token = page.url.searchParams.get('token');

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!token) {
			apiError = 'Missing reset token.';
			return;
		}
		if (password !== confirmPassword) {
			apiError = 'Passwords do not match.';
			return;
		}
		if (password.length < 8) {
			apiError = 'Password must be at least 8 characters.';
			return;
		}

		submitting = true;
		apiError = null;

		try {
			await resetPassword({ token, new_password: password });
			success = true;
			toast.success('Password reset successfully!');
		} catch (e: unknown) {
			apiError = e instanceof Error ? e.message : 'Something went wrong.';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="mt-10 flex min-h-[80vh] flex-1 items-center justify-center p-4">
	<Card class="w-full max-w-sm">
		{#if !token}
			<CardHeader class="items-center text-center">
				<div class="mb-2 flex size-14 items-center justify-center rounded-full bg-destructive/10">
					<CircleX class="size-7 text-destructive" />
				</div>
				<CardTitle class="text-2xl">Invalid Link</CardTitle>
				<CardDescription>
					The password reset link is missing its token or is invalid.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Button class="w-full" onclick={() => goto('/forgot-password')}>
					Request a new link
				</Button>
			</CardContent>
		{:else if !success}
			<CardHeader>
				<CardTitle class="text-2xl">Reset Password</CardTitle>
				<CardDescription>Enter your new password below.</CardDescription>
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
						<Label for="password">New Password</Label>
						<Input
							id="password"
							type="password"
							bind:value={password}
							placeholder="••••••••"
							required
							disabled={submitting}
						/>
					</div>
					<div class="grid gap-2">
						<Label for="confirmPassword">Confirm Password</Label>
						<Input
							id="confirmPassword"
							type="password"
							bind:value={confirmPassword}
							placeholder="••••••••"
							required
							disabled={submitting}
						/>
					</div>
					<Button type="submit" class="w-full" disabled={submitting}>
						{#if submitting}
							<Spinner class="mr-2 size-4" />
							Resetting…
						{:else}
							Reset Password
						{/if}
					</Button>
				</form>
			</CardContent>
			<CardFooter>
				<div class="w-full text-center text-sm">
					<a href="/login" class="underline">Back to login</a>
				</div>
			</CardFooter>
		{:else}
			<CardHeader class="items-center text-center">
				<div class="mb-2 flex size-14 items-center justify-center rounded-full bg-green-500/10">
					<CircleCheck class="size-7 text-green-500" />
				</div>
				<CardTitle class="text-2xl">Success!</CardTitle>
				<CardDescription>
					Your password has been changed successfully. You can now log in with your new password.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Button class="w-full" onclick={() => goto('/login')}>
					Log in
				</Button>
			</CardContent>
		{/if}
	</Card>
</div>
