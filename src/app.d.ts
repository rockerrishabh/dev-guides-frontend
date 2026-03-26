// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		google?: typeof google;
	}

	namespace google {
		namespace accounts {
			namespace id {
				function initialize(config: {
					client_id: string;
					callback: (response: { credential?: string }) => void;
					auto_select?: boolean;
					cancel_on_tap_outside?: boolean;
					use_fedcm_for_prompt?: boolean;
					itp_support?: boolean;
				}): void;
				function prompt(callback?: (notification: {
					isDisplayMoment: () => boolean;
					isDismissedMoment: () => boolean;
					getDismissedReason: () => string;
					isSkippedMoment: () => boolean;
					getMomentType: () => string;
				}) => void): void;
				function disableAutoSelect(): void;
				function revoke(hint: string, callback: (response: { successful: boolean; error?: string }) => void): void;
			}
		}
	}
}

export {};
