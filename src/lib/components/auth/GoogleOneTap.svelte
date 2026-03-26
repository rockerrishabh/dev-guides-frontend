<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { PUBLIC_GOOGLE_CLIENT_ID } from '$env/static/public';
	import { googleLogin } from '$lib/api/auth';
	import { auth } from '$lib/stores/auth.svelte';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';

	interface GoogleResponse {
		credential?: string;
	}

	onMount(() => {
		const handleCredentialResponse = async (response: GoogleResponse) => {
			if (!response.credential) return;

			try {
				auth.setSocialLoading(true);
				const result = await googleLogin({ idToken: response.credential });
				
				if (result.type === '2fa') {
					await goto(`/login/2fa?token=${result.token}`);
					return;
				}

				auth.setUser(result.data.user);
				toast.success(`Welcome back, ${result.data.user.name}!`);
				// Explicitly redirect to ensure user is moved out of the auth pages
				await goto('/dashboard');
			} catch (e: any) {
				console.error('One Tap Login Failed:', e);
				toast.error(e.message || 'Google login failed.');
			} finally {
				auth.setSocialLoading(false);
			}
		};

		// Load Google script if not already present
		if (!document.getElementById('google-jssdk')) {
			const script = document.createElement('script');
			script.id = 'google-jssdk';
			script.src = 'https://accounts.google.com/gsi/client';
			script.async = true;
			script.defer = true;
			script.onload = () => initOneTap();
			document.head.appendChild(script);
		} else {
			initOneTap();
		}

		function initOneTap() {
			if (typeof window.google === 'undefined') return;

			window.google.accounts.id.initialize({
				client_id: PUBLIC_GOOGLE_CLIENT_ID,
				callback: handleCredentialResponse,
				auto_select: true, // Optional: automatically select the account if only one is logged in
				cancel_on_tap_outside: false,
				use_fedcm_for_prompt: true,
				itp_support: true
			});

			// Only show prompt if not already authenticated
			if (!auth.isAuthenticated) {
				window.google.accounts.id.prompt();
			}
		}
	});
</script>

<!-- This component doesn't render anything visible, it just handles the Google One Tap logic -->
