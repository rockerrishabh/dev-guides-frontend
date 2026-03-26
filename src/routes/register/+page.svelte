<script lang="ts">
	import { superForm, defaults } from 'sveltekit-superforms';
	import { zod4, zod4Client } from 'sveltekit-superforms/adapters';
	import { formSchema } from './schema';
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
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { register, resendVerification } from '$lib/api/auth';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { Spinner } from '$lib/components/ui/spinner';
	import { MailCheck, RefreshCcw } from '@lucide/svelte';
	import { untrack } from 'svelte';
	import { auth } from '$lib/stores/auth.svelte';

	$effect(() => {
		if (auth.isAuthenticated && auth.initialized) {
			untrack(() => goto('/dashboard'));
		}
	});

	let submitting = $state(false);
	let apiError = $state<string | null>(null);
	let registered = $state(false);
	let registeredEmail = $state('');
	let resending = $state(false);

	async function handleResend() {
		if (!registeredEmail) return;
		resending = true;
		try {
			await resendVerification(registeredEmail);
			toast.success('Verification email resent!');
		} catch (e: unknown) {
			toast.error(e instanceof Error ? e.message : 'Failed to resend email.');
		} finally {
			resending = false;
		}
	}

	const { form, errors, enhance } = superForm(defaults(zod4(formSchema)), {
		SPA: true,
		validators: zod4Client(formSchema),
		async onUpdate({ form }) {
			if (!form.valid) return;

			submitting = true;
			apiError = null;

			try {
				await register({
					name: form.data.name,
					email: form.data.email,
					password: form.data.password
				});
				registeredEmail = form.data.email;
				registered = true;
				toast.success('Account created! Please check your email.');
			} catch (e: unknown) {
				apiError = e instanceof Error ? e.message : 'Registration failed. Please try again.';
			} finally {
				submitting = false;
			}
		}
	});
</script>

<div class="mt-10 flex min-h-[80vh] flex-1 items-center justify-center p-4">
	{#if registered}
		<Card class="w-full max-w-sm text-center">
			<CardHeader class="items-center">
				<div class="mb-2 flex size-14 items-center justify-center rounded-full bg-green-500/10">
					<MailCheck class="size-7 text-green-500" />
				</div>
				<CardTitle class="text-2xl">Check your inbox</CardTitle>
				<CardDescription>
					We've sent a verification link to <strong>{registeredEmail}</strong>. Click the link to
					activate your account.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<p class="text-sm text-muted-foreground">
					Didn't receive it? Check your spam folder or
					<button
						class="font-medium underline hover:text-primary disabled:opacity-50"
						onclick={handleResend}
						disabled={resending}
					>
						{#if resending}
							<RefreshCcw class="mr-1 inline-block size-3 animate-spin" />
						{/if}
						try again
					</button>.
				</p>
			</CardContent>
			<CardFooter class="justify-center">
				<Button variant="secondary" onclick={() => goto('/login')}>Go to login</Button>
			</CardFooter>
		</Card>
	{:else}
		<Card class="w-full max-w-sm">
			<CardHeader>
				<CardTitle class="text-2xl">Create an account</CardTitle>
				<CardDescription>Enter your information to create an account.</CardDescription>
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
						<Label for="name">Name</Label>
						<Input
							id="name"
							name="name"
							bind:value={$form.name}
							placeholder="John Doe"
							class="rounded-md"
							disabled={submitting}
						/>
						{#if $errors.name}
							<span class="text-sm font-medium text-destructive">{$errors.name}</span>
						{/if}
					</div>
					<div class="grid gap-2">
						<Label for="email">Email</Label>
						<Input
							id="email"
							name="email"
							type="email"
							bind:value={$form.email}
							placeholder="m@example.com"
							class="rounded-md"
							disabled={submitting}
						/>
						{#if $errors.email}
							<span class="text-sm font-medium text-destructive">{$errors.email}</span>
						{/if}
					</div>
					<div class="grid gap-2">
						<Label for="password">Password</Label>
						<Input
							id="password"
							name="password"
							type="password"
							bind:value={$form.password}
							class="rounded-md"
							disabled={submitting}
						/>
						{#if $errors.password}
							<span class="text-sm font-medium text-destructive">{$errors.password}</span>
						{/if}
					</div>
					<div class="grid gap-2">
						<Label for="confirmPassword">Confirm Password</Label>
						<Input
							id="confirmPassword"
							name="confirmPassword"
							type="password"
							bind:value={$form.confirmPassword}
							class="rounded-md"
							disabled={submitting}
						/>
						{#if $errors.confirmPassword}
							<span class="text-sm font-medium text-destructive">{$errors.confirmPassword}</span>
						{/if}
					</div>
					<div class="mt-2 flex flex-col gap-2">
						<div class="flex items-start space-x-2">
							<Checkbox id="terms" name="terms" bind:checked={$form.terms} />
							<div class="grid gap-1.5 leading-none">
								<Label
									for="terms"
									class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
								>
									Accept terms and conditions
								</Label>
								<p class="text-sm text-muted-foreground">
									You agree to our Terms of Service and Privacy Policy.
								</p>
							</div>
						</div>
					</div>
					{#if $errors.terms}
						<span class="text-sm font-medium text-destructive">{$errors.terms}</span>
					{/if}
					<Button type="submit" class="mt-2 w-full" disabled={submitting}>
						{#if submitting}
							<Spinner class="mr-2 size-4" />
							Creating account…
						{:else}
							Create account
						{/if}
					</Button>
				</form>
			</CardContent>
			<CardFooter>
				<div class="w-full text-center text-sm">
					Already have an account?
					<a href="/login" class="underline">Log in</a>
				</div>
			</CardFooter>
		</Card>
	{/if}
</div>
