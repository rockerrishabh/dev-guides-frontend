import { z } from 'zod';

export const formSchema = z
	.object({
		name: z.string().min(1, 'Name is required').min(2, 'Name must be at least 2 characters long'),
		email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
		password: z
			.string()
			.min(1, 'Password is required')
			.min(8, 'Password must be at least 8 characters long'),
		confirmPassword: z
			.string()
			.min(1, 'Confirm Password is required')
			.min(8, 'Confirm Password must be at least 8 characters long'),
		terms: z
			.boolean()
			.default(false)
			.refine((v) => v === true, {
				message: 'You must accept the terms and conditions'
			})
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword']
	});

export type FormSchema = typeof formSchema;
