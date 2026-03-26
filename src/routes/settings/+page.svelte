<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { onMount, untrack } from 'svelte';
	import * as Tabs from '$lib/components/ui/tabs';
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
	import { Spinner } from '$lib/components/ui/spinner';
	import { toast } from 'svelte-sonner';
	import {
		User,
		Lock,
		ShieldCheck,
		Monitor,
		LogOut,
		Trash2,
		ShieldAlert,
		Globe,
		MapPin
	} from '@lucide/svelte';
	import {
		getSessions,
		terminateSession,
		changePassword,
		updateAccount,
		disable2FA,
		type Session
	} from '$lib/api/auth';

	// Protected route guard
	$effect(() => {
		if (auth.initialized && !auth.isAuthenticated) {
			untrack(() => goto('/login'));
		}
	});

	// General tab state
	let name = $state(auth.user?.name ?? '');
	let updatingGeneral = $state(false);

	$effect(() => {
		if (auth.user && auth.user.name !== name && !updatingGeneral) {
			untrack(() => {
				name = auth.user!.name;
			});
		}
	});

	// Security tab state
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let updatingPassword = $state(false);

	// Sessions tab state
	let activeSessions = $state<Session[]>([]);
	let loadingSessions = $state(true);

	$effect(() => {
		if (auth.initialized && auth.isAuthenticated) {
			untrack(async () => {
				try {
					activeSessions = await getSessions();
				} catch (e: any) {
					console.error('Session load failed:', e);
				} finally {
					loadingSessions = false;
				}
			});
		}
	});

	async function handleUpdateGeneral() {
		if (!name || name === auth.user?.name) return;
		updatingGeneral = true;
		try {
			const updatedUser = await updateAccount({ name });
			auth.setUser(updatedUser);
			toast.success('Account updated successfully!');
		} catch (e: any) {
			toast.error(e.message || 'Update failed.');
		} finally {
			updatingGeneral = false;
		}
	}

	async function handleChangePassword() {
		if (newPassword !== confirmPassword) {
			toast.error('Passwords do not match');
			return;
		}
		updatingPassword = true;
		try {
			await changePassword({
				current_password: currentPassword,
				new_password: newPassword
			});
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
			toast.success('Password changed successfully.');
		} catch (e: any) {
			toast.error(e.message || 'Change password failed.');
		} finally {
			updatingPassword = false;
		}
	}

	async function handleTerminate(id: string) {
		try {
			await terminateSession(id);
			activeSessions = activeSessions.filter((s) => s.id !== id);
			toast.success('Session terminated.');
		} catch (e: any) {
			toast.error(e.message || 'Failed to terminate session.');
		}
	}

	async function handleDisable2FA() {
		if (!confirm('Are you sure you want to disable two-factor authentication?')) return;
		try {
			await disable2FA();
			if (auth.user) auth.setUser({ ...auth.user, two_factor_enabled: false });
			toast.success('Two-factor authentication disabled.');
		} catch (e: any) {
			toast.error(e.message || 'Failed to disable 2FA.');
		}
	}

	function getUAIcon(ua: string | null) {
		if (!ua) return Monitor;
		const lowerUA = ua.toLowerCase();
		if (lowerUA.includes('iphone') || lowerUA.includes('android')) return Monitor; // Could use Smartphone
		return Monitor;
	}
</script>

{#if auth.user}
	<div class="mx-auto max-w-4xl px-4 py-12">
		<header class="mb-10">
			<h1 class="text-3xl font-bold tracking-tight">Settings</h1>
			<p class="text-muted-foreground">Manage your account settings, security, and sessions.</p>
		</header>

		<Tabs.Root value="general" class="space-y-6">
			<Tabs.List class="w-full justify-start border-b bg-transparent p-0">
				<Tabs.Trigger
					value="general"
					class="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
				>
					General
				</Tabs.Trigger>
				<Tabs.Trigger
					value="security"
					class="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
				>
					Security
				</Tabs.Trigger>
				<Tabs.Trigger
					value="sessions"
					class="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
				>
					Sessions
				</Tabs.Trigger>
			</Tabs.List>

			<!-- General settings -->
			<Tabs.Content value="general" class="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Profile</CardTitle>
						<CardDescription>Update your basic account information.</CardDescription>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="flex items-center gap-6">
							<div
								class="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary"
							>
								<User class="size-10" />
							</div>
							<div class="space-y-1">
								<h3 class="text-lg font-medium">{auth.user.name}</h3>
								<p class="text-sm text-muted-foreground">{auth.user.email}</p>
							</div>
						</div>
						<div class="grid gap-2">
							<Label for="name">Full Name</Label>
							<Input id="name" bind:value={name} class="max-w-md" />
						</div>
					</CardContent>
					<CardFooter>
						<Button
							onclick={handleUpdateGeneral}
							disabled={updatingGeneral || name === auth.user.name}
						>
							{#if updatingGeneral}
								<Spinner class="mr-2 size-4" />
							{/if}
							Save Changes
						</Button>
					</CardFooter>
				</Card>
			</Tabs.Content>

			<!-- Security settings -->
			<Tabs.Content value="security" class="space-y-6">
				<!-- Change Password -->
				{#if auth.user}
					<Card>
						<CardHeader>
							<CardTitle>Password</CardTitle>
							<CardDescription>Update your password to keep your account secure.</CardDescription>
						</CardHeader>
						<CardContent class="space-y-4">
							<div class="grid gap-2">
								<Label for="currentPassword">Current Password</Label>
								<Input
									id="currentPassword"
									type="password"
									bind:value={currentPassword}
									class="max-w-md"
								/>
							</div>
							<div class="grid gap-2">
								<Label for="newPassword">New Password</Label>
								<Input id="newPassword" type="password" bind:value={newPassword} class="max-w-md" />
							</div>
							<div class="grid gap-2">
								<Label for="confirmPassword">Confirm New Password</Label>
								<Input
									id="confirmPassword"
									type="password"
									bind:value={confirmPassword}
									class="max-w-md"
								/>
							</div>
						</CardContent>
						<CardFooter>
							<Button
								onclick={handleChangePassword}
								disabled={updatingPassword || !currentPassword || !newPassword}
							>
								{#if updatingPassword}
									<Spinner class="mr-2 size-4" />
								{/if}
								Update Password
							</Button>
						</CardFooter>
					</Card>
				{/if}

				<!-- Two-factor Authentication -->
				<Card>
					<CardHeader>
						<div class="flex items-center justify-between">
							<div>
								<CardTitle>Two-Factor Authentication</CardTitle>
								<CardDescription>Add an extra layer of security to your account.</CardDescription>
							</div>
							<div
								class="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold {auth
									.user.two_factor_enabled
									? 'bg-green-500/10 text-green-500'
									: 'bg-muted text-muted-foreground'}"
							>
								<ShieldCheck class="size-3" />
								{auth.user.two_factor_enabled ? 'Enabled' : 'Disabled'}
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<p class="text-sm text-muted-foreground">
							2FA is currently {auth.user.two_factor_enabled ? 'enabled' : 'disabled'}. Use an
							authenticator app to generate secure codes.
						</p>
					</CardContent>
					<CardFooter class="flex gap-3">
						{#if auth.user.two_factor_enabled}
							<Button variant="destructive" onclick={handleDisable2FA}>Disable 2FA</Button>
						{:else}
							<a href="/settings/2fa">
								<Button>Enable 2FA</Button>
							</a>
						{/if}
					</CardFooter>
				</Card>
			</Tabs.Content>

			<!-- Active Sessions -->
			<Tabs.Content value="sessions" class="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Active Sessions</CardTitle>
						<CardDescription>
							These are the devices that are currently logged into your account.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{#if loadingSessions}
							<div class="flex items-center justify-center py-8">
								<Spinner class="size-8" />
							</div>
						{:else}
							<div class="divide-y rounded-md border">
								{#each activeSessions as session}
									{@const Icon = getUAIcon(session.user_agent)}
									<div class="flex items-center justify-between p-4">
										<div class="flex items-start gap-4">
											<div class="rounded-full bg-muted p-2">
												<Icon class="size-5" />
											</div>
											<div>
												<div class="flex items-center gap-2">
													<p class="font-medium">
														{session.user_agent || 'Unknown Device'}
													</p>
													{#if session.is_current}
														<span
															class="flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-center text-[10px] font-bold text-green-500 uppercase"
														>
															Current Session
														</span>
													{/if}
												</div>
												<div class="mt-1 flex gap-4 text-xs text-muted-foreground">
													<div class="flex items-center gap-1">
														<Globe class="size-3" />
														<span>{session.ip_address || 'Unknown IP'}</span>
													</div>
													<div class="flex items-center gap-1">
														<MapPin class="size-3" />
														<span>{new Date(session.created_at).toLocaleString()}</span>
													</div>
												</div>
											</div>
										</div>
										{#if !session.is_current}
											<Button
												size="sm"
												variant="ghost"
												class="text-destructive hover:bg-destructive/10 hover:text-destructive"
												onclick={() => handleTerminate(session.id)}
											>
												<Trash2 class="size-4" />
											</Button>
										{/if}
									</div>
								{/each}
							</div>
						{/if}
					</CardContent>
				</Card>
			</Tabs.Content>
		</Tabs.Root>
	</div>
{:else if !auth.initialized}
	<div class="flex min-h-[80vh] items-center justify-center">
		<Spinner class="size-8" />
	</div>
{/if}
