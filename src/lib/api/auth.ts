import { apiFetch, setAccessToken } from './client';

// ─── Shared types mirroring the backend ────────────────────────────────────

export interface User {
	id: string;
	name: string;
	email: string;
	avatar_url: string | null;
	is_verified: boolean;
	two_factor_enabled: boolean;
	created_at: string;
	updated_at: string;
}

// ─── Register ───────────────────────────────────────────────────────────────

export interface RegisterInput {
	name: string;
	email: string;
	password: string;
}

export async function register(input: RegisterInput): Promise<User> {
	return apiFetch<User>('/auth/register', {
		method: 'POST',
		body: JSON.stringify(input),
		skipAuth: true
	});
}

// ─── Login ──────────────────────────────────────────────────────────────────

export interface LoginInput {
	email: string;
	password: string;
	remember_me: boolean;
}

export interface LoginSuccess {
	user: User;
	access_token: string;
}

export interface Login2FA {
	message: string;
	temporary_token: string;
}

export type LoginResult = { type: 'success'; data: LoginSuccess } | { type: '2fa'; token: string };

export async function login(input: LoginInput): Promise<LoginResult> {
	// Backend responds 200 for full login, 202 for 2FA required.
	const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

	const res = await fetch(`${API_BASE}/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		credentials: 'include',
		body: JSON.stringify(input)
	});

	if (!res.ok) {
		let message = `Login failed (${res.status})`;
		try {
			const body = await res.json();
			message = body?.error ?? body?.message ?? message;
		} catch {
			// ignore
		}
		throw new Error(message);
	}

	if (res.status === 202) {
		const data: Login2FA = await res.json();
		return { type: '2fa', token: data.temporary_token };
	}

	const data: LoginSuccess = await res.json();
	setAccessToken(data.access_token);
	return { type: 'success', data };
}

// ─── 2FA Verify ─────────────────────────────────────────────────────────────

export interface Verify2FAInput {
	temporary_token: string;
	code: string;
	remember_me: boolean;
}

export async function verify2FA(input: Verify2FAInput): Promise<LoginSuccess> {
	const data = await apiFetch<LoginSuccess>('/auth/2fa/verify', {
		method: 'POST',
		body: JSON.stringify(input),
		skipAuth: true
	});
	setAccessToken(data.access_token);
	return data;
}

// ─── Refresh ─────────────────────────────────────────────────────────────────

export async function refresh(): Promise<LoginSuccess | null> {
	try {
		const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
		const res = await fetch(`${API_BASE}/auth/refresh`, {
			method: 'POST',
			credentials: 'include'
		});
		if (!res.ok) return null;
		const data: { access_token: string } = await res.json();
		setAccessToken(data.access_token);
		// Fetch user info with the new token
		const user = await getMe(data.access_token);
		return { user, access_token: data.access_token };
	} catch {
		return null;
	}
}

// ─── Me ─────────────────────────────────────────────────────────────────────

export async function getMe(token?: string): Promise<User> {
	const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
	const res = await fetch(`${API_BASE}/auth/me`, {
		headers: { Authorization: `Bearer ${token ?? ''}` },
		credentials: 'include'
	});
	if (!res.ok) throw new Error('Not authenticated');
	return res.json();
}

// ─── Logout ──────────────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
	setAccessToken(null);
	const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/v1';
	try {
		await fetch(`${API_BASE}/auth/logout`, {
			method: 'POST',
			credentials: 'include'
		});
	} catch (e) {
		console.error('Logout failed on backend:', e);
	}
}

// ─── Google OAuth ────────────────────────────────────────────────────────────

export async function googleLogin(accessToken: string): Promise<LoginSuccess> {
	const data = await apiFetch<LoginSuccess>('/auth/google', {
		method: 'POST',
		body: JSON.stringify({ access_token: accessToken }),
		skipAuth: true
	});
	setAccessToken(data.access_token);
	return data;
}

// ─── Verify Email ────────────────────────────────────────────────────────────

export async function verifyEmail(token: string, email: string | null): Promise<void> {
	const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/v1';
	const url = new URL(`${API_BASE}/auth/verify-email`);
	url.searchParams.set('token', token);
	if (email) url.searchParams.set('email', email);

	const res = await fetch(url.toString(), {
		credentials: 'include'
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || 'Email verification failed');
	}
}

export async function resendVerification(email: string): Promise<{ message: string }> {
	return apiFetch<{ message: string }>('/auth/resend-verification', {
		method: 'POST',
		body: JSON.stringify({ email }),
		skipAuth: true
	});
}

// ─── 2FA Setup ───────────────────────────────────────────────────────────────

export interface TwoFASetup {
	secret: string;
	qr_code_url: string;
}

export async function generate2FA(): Promise<TwoFASetup> {
	return apiFetch<TwoFASetup>('/auth/2fa/generate');
}

export interface Enable2FAInput {
	secret: string;
	code: string;
}

export async function enable2FA(input: Enable2FAInput): Promise<void> {
	await apiFetch('/auth/2fa/enable', {
		method: 'POST',
		body: JSON.stringify(input)
	});
}

// ─── Password Reset ──────────────────────────────────────────────────────────

export async function forgotPassword(email: string): Promise<{ message: string }> {
	return apiFetch<{ message: string }>('/auth/forgot-password', {
		method: 'POST',
		body: JSON.stringify({ email }),
		skipAuth: true
	});
}

export interface ResetPasswordInput {
	token: string;
	new_password: string;
}

export async function resetPassword(input: ResetPasswordInput): Promise<{ message: string }> {
	return apiFetch<{ message: string }>('/auth/reset-password', {
		method: 'POST',
		body: JSON.stringify(input),
		skipAuth: true
	});
}
