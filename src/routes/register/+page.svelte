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
	import { PUBLIC_GOOGLE_CLIENT_ID, PUBLIC_API_URL } from '$env/static/public';
	import GoogleOneTap from '$lib/components/auth/GoogleOneTap.svelte';

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

<GoogleOneTap />

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

				<!-- Google OAuth -->
				<div class="mt-4">
					<div class="relative flex items-center py-2">
						<div class="flex-1 border-t"></div>
						<span class="px-3 text-xs text-muted-foreground">or continue with</span>
						<div class="flex-1 border-t"></div>
					</div>
					<a
						href="https://accounts.google.com/o/oauth2/v2/auth?client_id={PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri={encodeURIComponent(
							PUBLIC_API_URL + '/auth/google/callback'
						)}&response_type=code&scope=openid%20email%20profile"
						class="flex w-full items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
						class:opacity-50={auth.socialLoading}
						class:pointer-events-none={auth.socialLoading}
					>
						{#if auth.socialLoading}
							<Spinner class="size-4" />
						{:else}
							<svg class="size-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
								<path
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
									fill="#4285F4"
								/>
								<path
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
									fill="#34A853"
								/>
								<path
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
									fill="#FBBC05"
								/>
								<path
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
									fill="#EA4335"
								/>
							</svg>
						{/if}
						Google
					</a>
				</div>
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
