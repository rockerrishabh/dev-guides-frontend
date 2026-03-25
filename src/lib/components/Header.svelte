<script lang="ts">
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import * as NavigationMenu from './ui/navigation-menu';
	import { navigationMenuTriggerStyle } from './ui/navigation-menu/navigation-menu-trigger.svelte';
	import Label from './ui/label/label.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import Input from './ui/input/input.svelte';
	import * as Drawer from './ui/drawer';
	import { ChevronDown, Menu, X } from '@lucide/svelte';
	import * as Sidebar from './ui/sidebar';
	import { Collapsible } from 'bits-ui';
	import Button from './ui/button/button.svelte';

	const isMobile = new IsMobile();
</script>

<header class="border-b border-gray-200 dark:border-gray-800">
	<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5">
		<Label>
			<a href="/">Dev Guides</a>
		</Label>
		<div class="flex items-center gap-4">
			<Input type="search" placeholder="Search..." class="w-56 max-w-xs rounded-md" />
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
				<Drawer.Root direction="right" noBodyStyles={true}>
					<Drawer.Trigger class="block md:hidden" aria-label="Menu"
						><Menu class="size-6" /></Drawer.Trigger
					>
					<Drawer.Content class="before:rounded-sm data-[vaul-drawer-direction=right]:w-2/4">
						<Drawer.Close class="absolute top-4 right-4 p-1"><X class="size-6" /></Drawer.Close>
						<nav class="mt-12">
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
									</Collapsible.Root><Sidebar.MenuButton>
										{#snippet child({ props })}
											<a href="/about" {...props}>About</a>
										{/snippet}
									</Sidebar.MenuButton>
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
								</Sidebar.Menu>
							</Sidebar.Provider>
						</nav>
					</Drawer.Content>
				</Drawer.Root>
				<section class="hidden md:block">
					<Button variant="secondary" size="default">
						<a href="/login">Login</a>
					</Button>
					<Button size="default">
						<a href="/register">Register</a>
					</Button>
				</section>
			</section>
		</div>
	</div>
</header>
