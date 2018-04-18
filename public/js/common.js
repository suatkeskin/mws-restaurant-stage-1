/**
 * Register to service worker.
 */
SWHelper.registerServiceWorker();

/**
 * Create an indexedDB promise
 */
let dbPromise;
document.addEventListener('DOMContentLoaded', (event) => {
    dbPromise = openIndexedDB();
});

/**
 * Load deferred styles on page load.
 */
let requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
if (requestAnimationFrame) {
    requestAnimationFrame(function () {
        window.setTimeout(loadDeferredStyles, 0);
    });
} else {
    window.addEventListener('load', loadDeferredStyles);
}

/**
 * Fade out pre loader on page load.
 */
window.addEventListener('load', () => {
    fadeOutPreLoader(document.getElementById("preloader"));
});

/**
 * Load deferred styles
 */
loadDeferredStyles = function () {
    const addStylesNode = document.getElementById("deferred-styles");
    const replacement = document.createElement("div");
    replacement.innerHTML = addStylesNode.textContent;
    document.body.appendChild(replacement);
    addStylesNode.parentElement.removeChild(addStylesNode);
};

/**
 * Fade out pre loader.
 */
fadeOutPreLoader = (el) => {
    el.style.opacity = 1;
    (function fade() {
        if ((el.style.opacity -= .05) < 0) {
            el.classList.add("hidden");
            document.getElementById("header").classList.remove("hidden");
            document.getElementById("maincontent").classList.remove("hidden");
            document.getElementById("footer").classList.remove("hidden");
        } else {
            requestAnimationFrame(fade);
        }
    })();
};

/**
 * Create an indexedDB that contains one objectStore: 'restaurants' that uses 'id' as its key and has an index called 'by-id', which is sorted by the 'id' property
 * @returns a promise for a database called 'restaurants'
 */
openIndexedDB = () => {
    // If the browser doesn't support service worker, we don't care about having a database
    if (!('serviceWorker' in navigator)) {
        return Promise.resolve();
    }
    return idb.open('restaurants-db', 1, function (upgradeDb) {
        let restaurantsStore = upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});
        restaurantsStore.createIndex('by-id', 'id')
    });
};

window.addEventListener('beforeinstallprompt', function (e) {
    e.userChoice.then(function (choiceResult) {
        console.log(choiceResult.outcome);
        if (choiceResult.outcome === 'dismissed') {
            console.error('User cancelled home screen install');
        } else {
            console.log('User added to home screen');
        }
    });
});