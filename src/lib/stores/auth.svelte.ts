import type { User } from '$lib/api/auth';
import { refresh, logout as apiLogout } from '$lib/api/auth';
import { goto } from '$app/navigation';

interface AuthState {
	user: User | null;
	loading: boolean;
	initialized: boolean;
}

function createAuthStore() {
	let state = $state<AuthState>({
		user: null,
		loading: false,
		initialized: false
	});

	return {
		get user() {
			return state.user;
		},
		get loading() {
			return state.loading;
		},
		get initialized() {
			return state.initialized;
		},
		get isAuthenticated() {
			return state.user !== null;
		},

		/** Called once on app boot from +layout.ts to restore a session. */
		async init() {
			if (state.initialized) return;
			state.loading = true;
			try {
				const result = await refresh();
				state.user = result?.user ?? null;
			} catch {
				state.user = null;
			} finally {
				state.loading = false;
				state.initialized = true;
			}
		},

		/** Called after a successful login/register. */
		setUser(user: User) {
			state.user = user;
			state.initialized = true;
		},

		/** Clears the auth state and redirects to /login. */
		async logout() {
			state.loading = true;
			try {
				await apiLogout();
			} finally {
				state.user = null;
				state.loading = false;
				goto('/login');
			}
		}
	};
}

export const auth = createAuthStore();
