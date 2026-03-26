<script lang="ts">
	import { page } from '$app/state';
	import { getPublicProfile, type PublicProfile } from '$lib/api/auth';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import {
		User,
		MapPin,
		Globe,
		Calendar,
		Briefcase,
		ArrowLeft,
		ExternalLink
	} from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	const userId = page.params.id;
	let profile = $state<PublicProfile | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		if (!userId) {
			error = 'User ID is missing';
			loading = false;
			return;
		}
		console.log('Fetching public profile for:', userId);
		try {
			profile = await getPublicProfile(userId);
			console.log('Profile loaded:', profile);
		} catch (e: any) {
			console.error('Profile load error:', e);
			error = e.message || 'Failed to load profile';
		} finally {
			loading = false;
		}
	});

	function formatDate(dateStr: string) {
		try {
			return new Date(dateStr).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});
		} catch (e) {
			return 'N/A';
		}
	}

	function getHostname(url: string | null) {
		if (!url) return '';
		try {
			// Ensure it has a protocol for the URL constructor
			const fullUrl = url.startsWith('http') ? url : `https://${url}`;
			return new URL(fullUrl).hostname;
		} catch (e) {
			return url.replace(/^https?:\/\//, '').split('/')[0];
		}
	}
</script>

<svelte:head>
	<title>{profile ? `${profile.name}'s Profile` : 'User Profile'}</title>
</svelte:head>

<div class="min-h-screen bg-muted/30">
	<!-- Header / Cover Area -->
	<div
		class="h-48 w-full bg-linear-to-r from-primary/20 via-primary/10 to-background md:h-64"
	></div>

	<div class="mx-auto -mt-24 max-w-4xl px-4 pb-20 md:-mt-32">
		{#if loading}
			<div
				class="flex min-h-[400px] items-center justify-center rounded-xl border bg-card p-12 shadow-sm"
			>
				<div class="flex flex-col items-center gap-4">
					<Spinner class="size-10" />
					<p class="animate-pulse text-muted-foreground">Loading profile...</p>
				</div>
			</div>
		{:else if error}
			<div
				class="rounded-xl border border-destructive/20 bg-destructive/5 p-12 text-center shadow-sm"
			>
				<div
					class="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive"
				>
					<User class="size-8" />
				</div>
				<h2 class="mb-2 text-2xl font-bold text-foreground">Profile Not Found</h2>
				<p class="mx-auto mb-8 max-w-md text-muted-foreground">{error}</p>
				<a href="/">
					<Button variant="outline">
						<ArrowLeft class="mr-2 size-4" />
						Back to Home
					</Button>
				</a>
			</div>
		{:else if profile}
			<div class="space-y-6">
				<!-- Profile Header Card -->
				<div class="rounded-2xl border bg-card p-6 shadow-sm md:p-8">
					<div class="flex flex-col items-start gap-6 md:flex-row md:items-end">
						<!-- Avatar -->
						<div class="relative">
							<div
								class="flex size-32 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 ring-4 ring-card md:size-40"
							>
								{#if profile.avatar_url}
									<img src={profile.avatar_url} alt={profile.name} class="size-full object-cover" />
								{:else}
									<User class="size-16 text-primary md:size-24" />
								{/if}
							</div>
							<div class="absolute -right-1 -bottom-2">
								<Badge class="border-2 border-background shadow-lg">
									<Briefcase class="mr-1 size-3" />
									{profile.role}
								</Badge>
							</div>
						</div>

						<!-- Basic Info -->
						<div class="flex-1 space-y-4">
							<div>
								<h1 class="text-3xl font-bold tracking-tight md:text-4xl">{profile.name}</h1>
								<p class="text-lg text-muted-foreground">@{profile.id.split('-')[0]}</p>
							</div>

							<div class="flex flex-wrap gap-4 text-sm text-muted-foreground">
								{#if profile.city || profile.country}
									<div class="flex items-center gap-1.5">
										<MapPin class="size-4" />
										<span>{[profile.city, profile.country].filter(Boolean).join(', ')}</span>
									</div>
								{/if}
								{#if profile.website}
									<a
										href={profile.website}
										target="_blank"
										rel="noopener noreferrer"
										class="flex items-center gap-1.5 text-primary hover:underline"
									>
										<Globe class="size-4" />
										<span>{getHostname(profile.website)}</span>
									</a>
								{:else}
									<div class="flex items-center gap-1.5">
										<Globe class="size-4" />
										<span>Web Presence</span>
									</div>
								{/if}
								<div class="flex items-center gap-1.5">
									<Calendar class="size-4" />
									<span>Joined {formatDate(profile.created_at)}</span>
								</div>
							</div>
						</div>

						<!-- Actions -->
						<div class="flex w-full gap-2 md:w-auto">
							<Button class="flex-1 md:flex-none">Follow</Button>
							<Button variant="outline" class="flex-1 md:flex-none">Message</Button>
						</div>
					</div>
				</div>

				<!-- Content Grid -->
				<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
					<!-- About / Bio -->
					<div class="space-y-6 md:col-span-2">
						<div class="rounded-2xl border bg-card p-6 shadow-sm md:p-8">
							<h3 class="mb-4 text-xl font-bold">About</h3>
							{#if profile.bio}
								<p class="text-lg leading-relaxed whitespace-pre-wrap text-muted-foreground">
									{profile.bio}
								</p>
							{:else}
								<p class="text-muted-foreground italic">This user hasn't shared a bio yet.</p>
							{/if}
						</div>

						<!-- Skills/Interests Placeholder -->
						<div class="rounded-2xl border bg-card p-6 shadow-sm md:p-8">
							<h3 class="mb-4 text-xl font-bold">Interests</h3>
							<div class="flex flex-wrap gap-2">
								<Badge variant="secondary">Development</Badge>
								<Badge variant="secondary">Architecture</Badge>
								<Badge variant="secondary">Rust</Badge>
								<Badge variant="secondary">SvelteKit</Badge>
								<Badge variant="secondary">Full Stack</Badge>
							</div>
						</div>
					</div>

					<!-- Sidebar / Stats -->
					<div class="space-y-6">
						<div class="rounded-2xl border bg-card p-6 shadow-sm">
							<h3 class="mb-4 font-bold">Statistics</h3>
							<div class="space-y-4">
								<div class="flex items-center justify-between border-b pb-4">
									<span class="text-sm text-muted-foreground">Followers</span>
									<span class="font-bold">1.2k</span>
								</div>
								<div class="flex items-center justify-between border-b pb-4">
									<span class="text-sm text-muted-foreground">Following</span>
									<span class="font-bold">482</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-sm text-muted-foreground">Posts</span>
									<span class="font-bold">143</span>
								</div>
							</div>
						</div>

						<div class="rounded-2xl border bg-card p-6 shadow-sm">
							<h3 class="mb-4 font-bold">Social Links</h3>
							{#if profile.website}
								<a
									href={profile.website}
									class="group flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted"
								>
									<div class="flex items-center gap-3">
										<Globe
											class="size-4 text-muted-foreground transition-colors group-hover:text-primary"
										/>
										<span class="text-sm font-medium">Personal Site</span>
									</div>
									<ExternalLink class="size-3 text-muted-foreground" />
								</a>
							{/if}
							<!-- Add more socials if we have them in the model -->
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
