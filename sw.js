importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.0.0/workbox-sw.js');

if (workbox) {
	console.log(`Workbox is loaded 👍`);

	// Silence all of the Workbox logs.
	workbox.core.setLogLevel(workbox.core.LOG_LEVELS.silent);

	// Enable Offline Google Analytics
	workbox.googleAnalytics.initialize();

	// Images
	workbox.routing.registerRoute(/\.(?:png|gif|jpg|jpeg|svg|webp)$/,
		workbox.strategies.cacheFirst({
			cacheName: 'images',
			plugins: [new workbox.expiration.Plugin({maxEntries: 100, maxAgeSeconds: 86400})] // 1 days
		})
	);

	// Public assets
	workbox.routing.registerRoute(/\.(?:js|css|json)$/, workbox.strategies.staleWhileRevalidate({cacheName: 'static-resources'}));

	// Google fonts
	workbox.routing.registerRoute(new RegExp('https://fonts.(?:googleapis|gstatic).com/(.*)'), workbox.strategies.staleWhileRevalidate());

	// Google maps request
	workbox.routing.registerRoute(new RegExp('https://maps.googleapis.com/maps/api/(.*)'), workbox.strategies.networkFirst());

	// Html page requests
	workbox.routing.registerRoute(new RegExp('(.*).html(.*)'), workbox.strategies.networkFirst({cacheName: 'html-pages-cache'}));

	// Html
	workbox.precaching.precacheAndRoute(['index.html', 'restaurant.html']);

	// Restaurant data requests
	workbox.routing.registerRoute(new RegExp('https://maps.googleapis.com/maps/api/(.*)'), workbox.strategies.networkFirst());
} else {
	console.log(`Workbox didn't load 👎`);
}
