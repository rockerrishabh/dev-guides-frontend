const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/v1';

// In-memory access token (not stored in localStorage to avoid XSS leakage).
let _accessToken: string | null = null;

export function getAccessToken() {
	return _accessToken;
}

export function setAccessToken(token: string | null) {
	_accessToken = token;
}

// Singleton in-flight refresh promise to avoid parallel refresh races.
let _refreshPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
	try {
		const res = await fetch(`${API_BASE}/auth/refresh`, {
			method: 'POST',
			credentials: 'include' // send the HttpOnly refresh_token cookie
		});
		if (!res.ok) {
			_accessToken = null;
			return null;
		}
		const data: { access_token: string } = await res.json();
		_accessToken = data.access_token;
		return data.access_token;
	} catch {
		_accessToken = null;
		return null;
	}
}

export async function refreshToken(): Promise<string | null> {
	if (_refreshPromise) return _refreshPromise;
	_refreshPromise = doRefresh().finally(() => {
		_refreshPromise = null;
	});
	return _refreshPromise;
}

export interface ApiError {
	status: number;
	message: string;
}

export class ApiRequestError extends Error {
	status: number;
	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
}

type FetchOptions = RequestInit & { skipAuth?: boolean };

export async function apiFetch<T = unknown>(path: string, options: FetchOptions = {}): Promise<T> {
	const { skipAuth = false, ...fetchOptions } = options;

	const headers = new Headers(fetchOptions.headers);
	if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
		headers.set('Content-Type', 'application/json');
	}

	if (!skipAuth && _accessToken) {
		headers.set('Authorization', `Bearer ${_accessToken}`);
	}

	let res = await fetch(`${API_BASE}${path}`, {
		...fetchOptions,
		headers,
		credentials: 'include'
	});

	// Attempt a transparent token refresh on 401.
	if (res.status === 401 && !skipAuth) {
		const newToken = await refreshToken();
		if (newToken) {
			headers.set('Authorization', `Bearer ${newToken}`);
			res = await fetch(`${API_BASE}${path}`, {
				...fetchOptions,
				headers,
				credentials: 'include'
			});
		}
	}

	if (!res.ok) {
		let message = `Request failed with status ${res.status}`;
		let text = '';
		try {
			text = await res.text();
			const body = JSON.parse(text);
			message = body?.error ?? body?.message ?? message;
		} catch {
			message = text || message;
		}
		throw new ApiRequestError(res.status, message);
	}

	// 204 No Content
	if (res.status === 204) return undefined as T;

	const text = await res.text();
	try {
		return JSON.parse(text) as T;
	} catch (e) {
		console.error('Failed to parse JSON response:', text);
		throw e;
	}
}
