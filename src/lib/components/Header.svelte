<script lang="ts">
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import * as NavigationMenu from './ui/navigation-menu';
	import { navigationMenuTriggerStyle } from './ui/navigation-menu/navigation-menu-trigger.svelte';
	import Label from './ui/label/label.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import Input from './ui/input/input.svelte';
	import * as Drawer from './ui/drawer';
	import { ChevronDown, Menu, X, LogOut, LayoutDashboard, Settings } from '@lucide/svelte';
	import * as Sidebar from './ui/sidebar';
	import { Collapsible } from 'bits-ui';
	import Button from './ui/button/button.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import * as DropdownMenu from './ui/dropdown-menu';

	const isMobile = new IsMobile();
</script>

<header class="sticky top-0 z-50 w-full border-b border-gray-200 bg-background/95 backdrop-blur-sm dark:border-gray-800">
	<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5">
		<Label>
			<a href="/">Dev Guides</a>
		</Label>
		<div class="flex items-center gap-2">
			<Input
				type="search"
				placeholder="Search..."
				class="hidden w-56 max-w-xs rounded-md md:block"
			/>
			<nav>
				<NavigationMenu.Root viewport={isMobile.current} class="hidden md:block">
					<NavigationMenu.List class="flex gap-1">
						<NavigationMenu.Item>
							<NavigationMenu.Link>
								{#snippet child()}
									<a href="/" class={navigationMenuTriggerStyle()}>Home</a>
								{/snippet}
							</NavigationMenu.Link>
						</NavigationMenu.Item>

						<NavigationMenu.Item>
							<NavigationMenu.Trigger>Categories</NavigationMenu.Trigger>
							<NavigationMenu.Content>
								<ul class="grid w-[200px] gap-4 p-2">
									<li>
										<NavigationMenu.Link href="##">Rust</NavigationMenu.Link>
										<NavigationMenu.Link href="##">Javascript</NavigationMenu.Link>
										<NavigationMenu.Link href="##">Linux</NavigationMenu.Link>
										<NavigationMenu.Link href="##">Windows</NavigationMenu.Link>
									</li>
								</ul>
							</NavigationMenu.Content>
						</NavigationMenu.Item>
						<NavigationMenu.Item>
							<NavigationMenu.Link>
								{#snippet child()}
									<a href="/about" class={navigationMenuTriggerStyle()}>About</a>
								{/snippet}
							</NavigationMenu.Link>
						</NavigationMenu.Item>
					</NavigationMenu.List>
				</NavigationMenu.Root>
			</nav>
			<section class="flex items-center gap-2">
				<ThemeToggle />

				<!-- Desktop auth section -->
				<section class="hidden md:flex md:items-center md:gap-2">
					{#if auth.isAuthenticated && auth.user}
						{@const user = auth.user}
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<button
										{...props}
										class="flex items-center gap-2 rounded-full focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none"
										aria-label="User menu"
									>
										{#if user.avatar_url}
											<img
												src={user.avatar_url}
												alt={user.name}
												class="size-8 rounded-full object-cover"
											/>
										{:else}
											<div
												class="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
											>
												{user.name.charAt(0).toUpperCase()}
											</div>
										{/if}
										<span class="text-sm font-medium">{user.name.split(' ')[0]}</span>
									</button>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="end" class="w-48">
								<DropdownMenu.Label class="font-normal">
									<div class="flex flex-col space-y-1">
										<p class="text-sm leading-none font-medium">{user.name}</p>
										<p class="text-xs leading-none text-muted-foreground">{user.email}</p>
									</div>
								</DropdownMenu.Label>
								<DropdownMenu.Separator />
								<DropdownMenu.Item>
									{#snippet child({ props })}
										<a href="/dashboard" class="flex cursor-pointer items-center" {...props}>
											<LayoutDashboard class="mr-2 size-4" />
											Dashboard
										</a>
									{/snippet}
								</DropdownMenu.Item>
								<DropdownMenu.Item>
									{#snippet child({ props })}
										<a href="/settings" class="flex cursor-pointer items-center" {...props}>
											<Settings class="mr-2 size-4" />
											Settings
										</a>
									{/snippet}
								</DropdownMenu.Item>
								<DropdownMenu.Separator />
								<DropdownMenu.Item
									class="text-destructive focus:text-destructive"
									onclick={() => auth.logout()}
								>
									<LogOut class="mr-2 size-4" />
									Sign out
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					{:else if auth.initialized}
						<Button variant="secondary" size="default">
							<a href="/login">Login</a>
						</Button>
						<Button size="default">
							<a href="/register">Register</a>
						</Button>
					{/if}
				</section>

				<!-- Mobile drawer -->
				<Drawer.Root direction="right" noBodyStyles={true}>
					<Drawer.Trigger class="block md:hidden" aria-label="Menu"
						><Menu class="size-6" /></Drawer.Trigger
					>
					<Drawer.Content class="before:rounded-sm data-[vaul-drawer-direction=right]:w-2/4">
						<Drawer.Close class="absolute top-4 right-4 p-1"><X class="size-6" /></Drawer.Close>
						<nav class="mt-12 p-4">
							<Input type="search" placeholder="Search..." class="mb-4 w-full rounded-md" />
							<Sidebar.Provider
								><Sidebar.Menu
									><Sidebar.MenuItem>
										<Sidebar.MenuButton>
											{#snippet child({ props })}
												<a href="/" {...props}>Home</a>
											{/snippet}
										</Sidebar.MenuButton>
									</Sidebar.MenuItem>
									<Collapsible.Root open class="group/collapsible">
										<Sidebar.MenuItem>
											<Sidebar.MenuButton
												><Collapsible.Trigger class="flex w-full items-center justify-between"
													>Categories <ChevronDown class="size-6" /></Collapsible.Trigger
												></Sidebar.MenuButton
											>
											<Collapsible.Content>
												<Sidebar.MenuSub>
													<Sidebar.MenuSubItem>Rust</Sidebar.MenuSubItem>
													<Sidebar.MenuSubItem>Javascript</Sidebar.MenuSubItem>
													<Sidebar.MenuSubItem>Linux</Sidebar.MenuSubItem>
													<Sidebar.MenuSubItem>Windows</Sidebar.MenuSubItem>
												</Sidebar.MenuSub>
											</Collapsible.Content>
										</Sidebar.MenuItem>
									</Collapsible.Root>
									<Sidebar.MenuButton>
										{#snippet child({ props })}
											<a href="/about" {...props}>About</a>
										{/snippet}
									</Sidebar.MenuButton>

									{#if auth.isAuthenticated && auth.user}
										<Sidebar.MenuButton>
											{#snippet child({ props })}
												<a href="/dashboard" {...props}>
													<LayoutDashboard class="mr-2 size-4" />
													Dashboard
												</a>
											{/snippet}
										</Sidebar.MenuButton>
										<Sidebar.MenuButton>
											{#snippet child({ props })}
												<a href="/settings" {...props}>
													<Settings class="mr-2 size-4" />
													Settings
												</a>
											{/snippet}
										</Sidebar.MenuButton>
										<Sidebar.MenuButton onclick={() => auth.logout()}>
											<LogOut class="mr-2 size-4" />
											Sign out
										</Sidebar.MenuButton>
									{:else}
										<Sidebar.MenuButton>
											{#snippet child({ props })}
												<a href="/login" {...props}>Login</a>
											{/snippet}
										</Sidebar.MenuButton>
										<Sidebar.MenuButton>
											{#snippet child({ props })}
												<a href="/register" {...props}>Register</a>
											{/snippet}
										</Sidebar.MenuButton>
									{/if}
								</Sidebar.Menu></Sidebar.Provider
							>
						</nav>
					</Drawer.Content>
				</Drawer.Root>
			</section>
		</div>
	</div>
</header>
