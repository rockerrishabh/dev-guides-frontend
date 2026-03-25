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
		onUpdate({ form }) {
			if (form.valid) {
				console.log('Valid login:', form.data);
				// TODO: call login api
			}
		}
	});
</script>

<div class="mt-10 flex min-h-[80vh] flex-1 items-center justify-center p-4">
	<Card class="w-full max-w-sm">
		<CardHeader>
			<CardTitle class="text-2xl">Login</CardTitle>
			<CardDescription>Enter your email below to login to your account.</CardDescription>
		</CardHeader>
		<CardContent>
			<form method="POST" use:enhance class="grid gap-4">
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
					<div class="flex items-center">
						<Label for="password">Password</Label>
						<a href="/login/forgot" class="ml-auto inline-block text-sm underline">
							Forgot your password?
						</a>
					</div>
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
				<div class="flex items-center space-x-2">
					<Checkbox id="rememberMe" name="rememberMe" bind:checked={$form.rememberMe} />
					<Label
						for="rememberMe"
						class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
					>
						Remember me
					</Label>
				</div>
				<Button type="submit" class="mt-2 w-full">Login</Button>
			</form>
		</CardContent>
		<CardFooter>
			<div class="w-full text-center text-sm">
				Don't have an account?
				<a href="/register" class="underline">Sign up</a>
			</div>
		</CardFooter>
	</Card>
</div>
