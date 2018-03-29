importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.0.0/workbox-sw.js');

if (workbox) {
    console.log(`Workbox is loaded 👍`);

    // Images
    workbox.routing.registerRoute(
        /\.(?:png|gif|jpg|jpeg|svg|webp)$/,
        workbox.strategies.cacheFirst({
            cacheName: 'images-cache',
            plugins: [new workbox.expiration.Plugin({
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
            })]
        })
    );

    // Public assets
    workbox.routing.registerRoute(
        /\.(?:js|css|json)$/,
        workbox.strategies.staleWhileRevalidate({
            cacheName: 'public-assets-cache'
        })
    );

    // Google fonts
    workbox.routing.registerRoute(new RegExp('https://fonts.(?:googleapis|gstatic).com/(.*)'), workbox.strategies.staleWhileRevalidate(),);

    // Google maps request
    workbox.routing.registerRoute(new RegExp('https://maps.googleapis.com/maps/api/(.*)'), workbox.strategies.networkFirst());

    // Html page requests
    workbox.routing.registerRoute(new RegExp('(.*).html(.*)'), workbox.strategies.networkFirst({cacheName: 'html-pages-cache'}));

    // Html
    workbox.precaching.precacheAndRoute(['index.html', 'restaurant.html']);
} else {
    console.log(`Workbox didn't load 👎`);
}
