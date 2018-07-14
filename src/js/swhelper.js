/**
 * Common service worker helper functions.
 */
class SWHelper {
	static registerServiceWorker() {
		if ('serviceWorker' in navigator) {
			window.addEventListener('load', () => {
				navigator.serviceWorker.register('/sw.js').then(registration => {
					console.log(`Service Worker registered! Scope: ${registration.scope}`);
				}).catch(() => {
					console.log('Service Worker registration failed!');
				});
			});
		}
	}
}