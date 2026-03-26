<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '$lib/components/ui/card';
	import { User, ShieldCheck, Mail, Calendar } from '@lucide/svelte';

	onMount(() => {
		// Wait for auth to finish initialising before guarding.
		const check = setInterval(() => {
			if (!auth.initialized) return;
			clearInterval(check);
			if (!auth.isAuthenticated) {
				goto('/login');
			}
		}, 50);
	});
</script>

{#if auth.user}
	{@const user = auth.user}
	<div class="mx-auto max-w-3xl px-4 py-12">
		<h1 class="mb-8 text-3xl font-bold">Dashboard</h1>

		<div class="grid gap-6 sm:grid-cols-2">
			<!-- Profile card -->
			<Card>
				<CardHeader class="flex-row items-center gap-4 space-y-0">
					{#if user.avatar_url}
						<img src={user.avatar_url} alt={user.name} class="size-14 rounded-full object-cover" />
					{:else}
						<div
							class="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary"
						>
							<User class="size-6" />
						</div>
					{/if}
					<div>
						<CardTitle>{user.name}</CardTitle>
						<CardDescription>{user.email}</CardDescription>
					</div>
				</CardHeader>
				<CardContent class="grid gap-2 text-sm">
					<div class="flex items-center gap-2 text-muted-foreground">
						<Mail class="size-4" />
						<span>Email {user.is_verified ? 'verified ✓' : 'not verified'}</span>
					</div>
					<div class="flex items-center gap-2 text-muted-foreground">
						<ShieldCheck class="size-4" />
						<span>2FA {user.two_factor_enabled ? 'enabled ✓' : 'not enabled'}</span>
					</div>
					<div class="flex items-center gap-2 text-muted-foreground">
						<Calendar class="size-4" />
						<span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
					</div>
				</CardContent>
			</Card>

			<!-- Quick actions -->
			<Card>
				<CardHeader>
					<CardTitle>Account & Security</CardTitle>
					<CardDescription>Manage your authentication settings.</CardDescription>
				</CardHeader>
				<CardContent class="grid gap-3">
					{#if !user.two_factor_enabled}
						<a href="/settings/2fa">
							<Button variant="outline" class="w-full justify-start gap-2">
								<ShieldCheck class="size-4" />
								Enable Two-Factor Auth
							</Button>
						</a>
					{/if}
					<Button
						variant="destructive"
						class="w-full justify-start gap-2"
						onclick={() => auth.logout()}
					>
						Sign out
					</Button>
				</CardContent>
			</Card>
		</div>
	</div>
{:else if !auth.initialized}
	<div class="flex min-h-[80vh] items-center justify-center">
		<span class="text-muted-foreground">Loading…</span>
	</div>
{/if}
