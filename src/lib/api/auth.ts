import { PUBLIC_API_URL } from '$env/static/public';
import { apiFetch, setAccessToken } from './client';

// ─── Shared types mirroring the backend ────────────────────────────────────

export interface User {
	id: string;
	name: string;
	email: string;
	avatar_url: string | null;
	is_verified: boolean;
	two_factor_enabled: boolean;
	has_password: boolean;
	created_at: string;
	updated_at: string;
}

export interface UserProfile {
	id: string;
	user_id: string;
	bio: string | null;
	phone_number: string | null;
	address: string | null;
	city: string | null;
	state: string | null;
	country: string | null;
	zip_code: string | null;
	website: string | null;
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
	const data = await apiFetch<{ user: User; has_password: boolean }>('/auth/register', {
		method: 'POST',
		body: JSON.stringify(input),
		skipAuth: true
	});
	return { ...data.user, has_password: data.has_password };
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
	has_password: boolean;
}

export interface Login2FA {
	message: string;
	temporary_token: string;
}

export type LoginResult = { type: 'success'; data: LoginSuccess } | { type: '2fa'; token: string };

export async function login(input: LoginInput): Promise<LoginResult> {
	// Backend responds 200 for full login, 202 for 2FA required.
	const API_BASE = PUBLIC_API_URL ?? 'http://localhost:8080/v1';

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

	console.log('Login response status:', res.status);
	if (res.status === 202) {
		const data: Login2FA = await res.json();
		console.log('Login result: 2FA required', data);
		return { type: '2fa', token: data.temporary_token };
	}

	const rawData: LoginSuccess = await res.json();
	// Remap has_password into user
	const data: LoginSuccess = {
		...rawData,
		user: { ...rawData.user, has_password: rawData.has_password }
	};
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
	const rawData = await apiFetch<LoginSuccess>('/auth/2fa/verify', {
		method: 'POST',
		body: JSON.stringify(input),
		skipAuth: true
	});
	const data: LoginSuccess = {
		...rawData,
		user: { ...rawData.user, has_password: rawData.has_password }
	};
	setAccessToken(data.access_token);
	return data;
}

// ─── Refresh ─────────────────────────────────────────────────────────────────

export async function refresh(): Promise<LoginSuccess | null> {
	try {
		const API_BASE = PUBLIC_API_URL ?? 'http://localhost:8080/v1';
		const res = await fetch(`${API_BASE}/auth/refresh`, {
			method: 'POST',
			credentials: 'include'
		});
		if (!res.ok) return null;
		const data: { access_token: string } = await res.json();
		setAccessToken(data.access_token);
		const res_me = await fetch(`${API_BASE}/auth/me`, {
			headers: { Authorization: `Bearer ${data.access_token}` },
			credentials: 'include'
		});
		if (!res_me.ok) return null;
		const user_res: { user: User; has_password: boolean } = await res_me.json();
		const user = { ...user_res.user, has_password: user_res.has_password };
		return { user, access_token: data.access_token, has_password: user_res.has_password };
	} catch {
		return null;
	}
}

// ─── Me ─────────────────────────────────────────────────────────────────────

export async function getMe(token?: string): Promise<User> {
	const API_BASE = PUBLIC_API_URL ?? 'http://localhost:8080/v1';
	const res = await fetch(`${API_BASE}/auth/me`, {
		headers: { Authorization: `Bearer ${token ?? ''}` },
		credentials: 'include'
	});
	if (!res.ok) throw new Error('Not authenticated');
	const data: { user: User; has_password: boolean } = await res.json();
	return { ...data.user, has_password: data.has_password };
}

// ─── Logout ──────────────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
	setAccessToken(null);
	const API_BASE = PUBLIC_API_URL ?? 'http://localhost:8080/v1';
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

export async function googleLogin(options: { 
	accessToken?: string; 
	idToken?: string;
	remember_me?: boolean;
}): Promise<LoginResult> {
	const API_BASE = PUBLIC_API_URL ?? 'http://localhost:8080/v1';
	const res = await fetch(`${API_BASE}/auth/google`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		credentials: 'include',
		body: JSON.stringify({ 
			access_token: options.accessToken,
			id_token: options.idToken,
			remember_me: options.remember_me ?? true
		})
	});

	if (!res.ok) {
		let message = `Google login failed (${res.status})`;
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

	const rawData: LoginSuccess & { has_password: boolean } = await res.json();
	setAccessToken(rawData.access_token);
	return {
		type: 'success',
		data: {
			user: { ...rawData.user, has_password: rawData.has_password },
			access_token: rawData.access_token,
			has_password: rawData.has_password
		}
	};
}

// ─── Verify Email ────────────────────────────────────────────────────────────

export async function verifyEmail(token: string, email: string | null): Promise<void> {
	const API_BASE = PUBLIC_API_URL ?? 'http://localhost:8080/v1';
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

export async function disable2FA(): Promise<void> {
	await apiFetch('/auth/2fa/disable', {
		method: 'POST'
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
// ─── Sessions ───────────────────────────────────────────────────────────────

export interface Session {
	id: string;
	user_agent: string | null;
	ip_address: string | null;
	expires_at: string;
	created_at: string;
	is_current: boolean;
}

export async function getSessions(): Promise<Session[]> {
	return apiFetch<Session[]>('/auth/sessions');
}

export async function terminateSession(id: string): Promise<void> {
	await apiFetch(`/auth/sessions/${id}`, { method: 'DELETE' });
}

// ─── Account Settings ────────────────────────────────────────────────────────

export interface ChangePasswordInput {
	current_password?: string;
	new_password: string;
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
	await apiFetch('/auth/change-password', {
		method: 'POST',
		body: JSON.stringify(input)
	});
}

export async function updateAccount(data: { name: string }): Promise<User> {
	const res_data = await apiFetch<{ user: User; has_password: boolean }>('/auth/me', {
		method: 'PATCH',
		body: JSON.stringify(data)
	});
	return { ...res_data.user, has_password: res_data.has_password };
}

// ─── Profile ───────────────────────────────────────────────────────────────

export interface UpdateProfileInput {
	bio?: string;
	phone_number?: string;
	address?: string;
	city?: string;
	state?: string;
	country?: string;
	zip_code?: string;
	website?: string;
}

export interface PublicProfile {
	id: string;
	name: string;
	avatar_url: string | null;
	role: string;
	bio: string | null;
	website: string | null;
	city: string | null;
	country: string | null;
	created_at: string;
}

export interface ProfileResponse {
	profile: UserProfile | null;
	oauth_accounts: any[]; // OAuthAccount interface if we care about it
}

export async function getProfile(): Promise<ProfileResponse> {
	return apiFetch<ProfileResponse>('/profile');
}

export async function updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
	return apiFetch<UserProfile>('/profile', {
		method: 'PATCH',
		body: JSON.stringify(input)
	});
}

export async function getPublicProfile(id: string): Promise<PublicProfile> {
	return apiFetch<PublicProfile>(`/profile/${id}`, { skipAuth: true });
}
