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

	const { form, errors, enhance } = superForm(defaults(zod4(formSchema)), {
		SPA: true,
		validators: zod4Client(formSchema),
		async onUpdate({ form }) {
			if (form.valid) {
				console.log('Valid registration:', form.data);
				// TODO: call register api
			}
		}
	});
</script>

<div class="mt-10 flex min-h-[80vh] flex-1 items-center justify-center p-4">
	<Card class="w-full max-w-sm">
		<CardHeader>
			<CardTitle class="text-2xl">Create an account</CardTitle>
			<CardDescription>Enter your information to create an account.</CardDescription>
		</CardHeader>
		<CardContent>
			<form method="POST" use:enhance class="grid gap-4">
				<div class="grid gap-2">
					<Label for="name">Name</Label>
					<Input
						id="name"
						name="name"
						bind:value={$form.name}
						placeholder="John Doe"
						class="rounded-md"
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
				<Button type="submit" class="mt-2 w-full">Create account</Button>
			</form>
		</CardContent>
		<CardFooter>
			<div class="w-full text-center text-sm">
				Already have an account?
				<a href="/login" class="underline">Log in</a>
			</div>
		</CardFooter>
	</Card>
</div>
